#pragma once
#include <winsock2.h>
#include <ws2tcpip.h>
#include <string>
#include <sstream>

#pragma comment(lib, "ws2_32.lib")

struct HttpResponse {
    int status = 0;
    std::string body;
};

class HttpClient {
    std::string host;
    int port;
public:
    HttpClient(const std::string& h, int p = 80, bool https_ignored = false)
        : host(h), port(p) {}

    HttpResponse Get(const std::string& path) {
        return request("GET", path, "", "application/json");
    }

    HttpResponse Post(const std::string& path,
                      const std::string& body,
                      const std::string& type)
    {
        return request("POST", path, body, type);
    }

private:
    HttpResponse request(const std::string& method,
                         const std::string& path,
                         const std::string& body,
                         const std::string& type)
    {
        HttpResponse resp;
        WSADATA wsa;
        WSAStartup(MAKEWORD(2,2), &wsa);

        SOCKET sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if (sock == INVALID_SOCKET) {
            WSACleanup();
            return resp;
        }

        sockaddr_in server{};
        server.sin_family = AF_INET;
        server.sin_port = htons(port);
        inet_pton(AF_INET, host.c_str(), &server.sin_addr);

        if (connect(sock, (sockaddr*)&server, sizeof(server)) == SOCKET_ERROR) {
            closesocket(sock);
            WSACleanup();
            return resp;
        }

        // Build HTTP request
        std::ostringstream req;
        req << method << " " << path << " HTTP/1.1\r\n";
        req << "Host: " << host << "\r\n";
        req << "Connection: close\r\n";

        if (method == "POST") {
            req << "Content-Type: " << type << "\r\n";
            req << "Content-Length: " << body.size() << "\r\n";
        }
        req << "\r\n";

        if (method == "POST") req << body;

        std::string reqStr = req.str();
        send(sock, reqStr.c_str(), reqStr.size(), 0);

        // Receive response
        char buffer[2048];
        int bytes;
        std::string raw;

        while ((bytes = recv(sock, buffer, sizeof(buffer), 0)) > 0) {
            raw.append(buffer, bytes);
        }

        closesocket(sock);
        WSACleanup();

        // Parse HTTP
        size_t pos = raw.find("\r\n\r\n");
        if (pos != std::string::npos) {
            std::string header = raw.substr(0, pos);
            resp.body = raw.substr(pos + 4);

            // Parse status code
            size_t sp = header.find(' ');
            if (sp != std::string::npos) {
                resp.status = std::stoi(header.substr(sp + 1, 3));
            }
        }

        return resp;
    }
};
