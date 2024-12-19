/*
use deno_core::{op, Extension, Op};
use tokio::net::TcpStream;
use tokio_rustls::{TlsAcceptor};
use tokio_rustls::rustls::{Certificate, PrivateKey, ServerConfig};
use deno_core::anyhow::Error;
use std::{sync::Arc};
use rustls_pemfile as pemfile;

#[cfg(unix)]
use std::os::unix::io::{FromRawFd};
#[cfg(windows)]
use std::os::windows::io::{FromRawSocket};

#[op]
pub async fn upgrade_to_tls(
    tcp_stream_handle: i32,
    cert_pem: String,
    key_pem: String,
) -> Result<i32, Error> {
    // Convert raw handle into TcpStream
    let tcp_stream = unsafe {
        #[cfg(unix)]
        TcpStream::from_std(std::net::TcpStream::from_raw_fd(tcp_stream_handle)).map_err(|e| Error::msg(e.to_string()))?;
        #[cfg(windows)]
        TcpStream::from_std(std::net::TcpStream::from_raw_socket(tcp_stream_handle as u64)).map_err(|e| Error::msg(e.to_string()))?
    };

    // Parse certs and keys
    let certs = pemfile::certs(&mut cert_pem.as_bytes()).map_err(|e| Error::msg(format!("Cert parse error: {:?}", e)))?;
    let mut keys = pemfile::pkcs8_private_keys(&mut key_pem.as_bytes()).map_err(|e| Error::msg(format!("Key parse error: {:?}", e)))?;
    if keys.is_empty() {
        return Err(Error::msg("No private keys found"));
    }

    let config = ServerConfig::builder()
        .with_safe_defaults()
        .with_no_client_auth()
        .with_single_cert(
            certs.into_iter().map(Certificate).collect(),
            PrivateKey(keys.remove(0)),
        )
        .map_err(|e| Error::msg(format!("Config error: {:?}", e)))?;
    let acceptor = TlsAcceptor::from(Arc::new(config));

    // Perform TLS handshake
    let tls_stream = acceptor.accept(tcp_stream).await.map_err(|e| Error::msg(format!("TLS handshake failed: {:?}", e)))?;
    Ok(tcp_stream_handle) // Replace this with the proper handle logic
}

pub fn init() -> Extension {
    Extension {
        name: "tls_extension",
        ops: vec![upgrade_to_tls::DECL].into(),
        ..Default::default()
    }
}
// */

use std::ffi::CStr;
use std::os::raw::{c_char, c_int};
use std::os::windows::io::{FromRawSocket, AsRawSocket};
use std::sync::Arc;
use tokio::runtime::Runtime;
use tokio::net::TcpStream;
use tokio_rustls::rustls::{Certificate, PrivateKey, ServerConfig};
use tokio_rustls::TlsAcceptor;

#[no_mangle]
pub extern "C" fn upgrade_to_tls(
    tcp_rid: c_int,
    cert_ptr: *const c_char,
    cert_len: usize,
    key_ptr: *const c_char,
    key_len: usize,
) -> c_int {
    // Safety: Handle unsafe pointers for cert and key
    let cert_bytes: &[u8] = unsafe {
        if cert_ptr.is_null() {
            return -1; // Return error code
        }
        std::slice::from_raw_parts(cert_ptr as *const u8, cert_len)
    };

    let key_bytes: &[u8] = unsafe {
        if key_ptr.is_null() {
            return -1; // Return error code
        }
        std::slice::from_raw_parts(key_ptr as *const u8, key_len)
    };

    // Parse certificates and private keys
    let certs = match rustls_pemfile::certs(&mut cert_bytes.as_ref()) {
        Ok(certs) => certs.into_iter().map(Certificate).collect(),
        Err(_) => return -1, // Return error code
    };

    let mut keys = match rustls_pemfile::pkcs8_private_keys(&mut key_bytes.as_ref()) {
        Ok(keys) => keys,
        Err(_) => return -1, // Return error code
    };

    let private_key = match keys.pop() {
        Some(key) => PrivateKey(key),
        None => return -1, // Return error code
    };

    // Configure TLS
    let config = match ServerConfig::builder()
        .with_safe_defaults()
        .with_no_client_auth()
        .with_single_cert(certs, private_key)
    {
        Ok(config) => Arc::new(config),
        Err(_) => return -1, // Return error code
    };

    let acceptor = TlsAcceptor::from(config);

    // Use Tokio runtime to perform async operations
    let runtime = Runtime::new().unwrap();

    let result = runtime.block_on(async {
        // Convert the tcp_rid to a TcpStream
        let std_stream = unsafe { std::net::TcpStream::from_raw_socket(tcp_rid as u64) };
        std_stream.set_nonblocking(true).unwrap();
        let tokio_stream = match TcpStream::from_std(std_stream) {
            Ok(s) => s,
            Err(_) => return -1, // Error converting to Tokio stream
        };

        // Perform the TLS handshake
        match acceptor.accept(tokio_stream).await {
            Ok(tls_stream) => {
                // Extract the raw socket descriptor from the TLS stream
                let raw_socket = tls_stream.get_ref().0.as_raw_socket();
                raw_socket as c_int
            }
            Err(_) => -1, // TLS handshake failed
        }
    });

    result
}
