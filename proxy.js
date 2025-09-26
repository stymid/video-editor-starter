const http = require("http");
const zlib = require("zlib");
const { pipeline } = require("stream");

// The proxy's port
const PORT = 9000;

// List of our backend servers
const mainServers = [{ host: "localhost", port: 8060 }];

// Create the proxy server
const proxy = http.createServer();

proxy.on("request", (clientRequest, proxyResponse) => {
  // Select a server to route the incoming request to (using round-robin algorithm)
  const mainServer = mainServers.shift();
  mainServers.push(mainServer);

  // The request that we are sending to one of our main servers
  const proxyRequest = http.request({
    host: mainServer.host,
    port: mainServer.port,
    path: clientRequest.url,
    method: clientRequest.method,
    headers: clientRequest.headers,
  });

  // When we receive a response from one of our main servers
  proxyRequest.on("response", (mainServerResponse) => {
    // Check if the content type is suitable for compression
    const contentType = mainServerResponse.headers["content-type"];
    const compressibleTypes = [
      "text/html",
      "text/css",
      "application/javascript",
      "application/json",
    ];

    // If the content type is suitable for compression. We can do any other check here, e.g. adding a limit for body size to not compress small bodies
    // or not compress specific sensitive routes, etc.
    const shouldCompress = compressibleTypes.some((type) =>
      contentType.includes(type)
    );

    if (shouldCompress) {
      proxyResponse.setHeader("Content-Encoding", "gzip");
      proxyResponse.removeHeader("Content-Length");
      proxyResponse.setHeader("Transfer-Encoding", "chunked");

      // Set the status code and headers for the response that we are sending to the client
      proxyResponse.writeHead(
        mainServerResponse.statusCode,
        mainServerResponse.headers
      );

      // Pipe the compressed response to the client (ideally we should check the Accept-Encoding header first)
      pipeline(mainServerResponse, zlib.createGzip(), proxyResponse, (err) => {
        if (err) {
          console.error("An error occurred:", err);
          proxyResponse.end();
        }
      });
    } else {
      // If the content type is not suitable for compression, simply pass through the response
      proxyResponse.writeHead(
        mainServerResponse.statusCode,
        mainServerResponse.headers
      );

      // Pipe the response from the main server to the response to the client without compression
      mainServerResponse.pipe(proxyResponse);
    }
  });

  // Our proxy should be extremely robust, so the more error handling we do, the better.
  // We don't want our proxy to go down no matter what happens in the main servers
  proxyRequest.on("error", (e) => {
    console.log(e);
  });

  // Write the body of the client's request to the body of proxy's request being made
  // to one of our servers
  clientRequest.pipe(proxyRequest);
});

proxy.listen(PORT, () => {
  console.log(`Proxy server is now listening on port ${PORT}`);
});
