#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <map>
#include <vector>
#include <cstring>
#include <winsock2.h>
#include <ws2tcpip.h>
#include <thread>
#include <memory>

#pragma comment(lib, "ws2_32.lib")
#pragma comment(lib, "wsock32.lib")

std::string readFile(const std::string& filename) {
    std::ifstream f(filename);
    if (!f) return "[]";
    std::stringstream buffer;
    buffer << f.rdbuf();
    return buffer.str();
}

void handleClient(SOCKET clientSocket) {
    char buffer[2048] = {0};
    int bytesReceived = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
    
    if (bytesReceived > 0) {
        std::string request(buffer);
        std::string response;
        
        // Parse request
        if (request.find("GET /api/genres") != std::string::npos) {
            response = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n";
            response += R"(["Action", "Comedy", "Drama", "Thriller"])";
        }
        else if (request.find("GET /api/questions") != std::string::npos) {
            response = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n";
            response += R"([{"id":1,"question":"Sample Q1?","options":["A","B","C","D"]},{"id":2,"question":"Sample Q2?","options":["A","B","C","D"]}])";
        }
        else if (request.find("GET /api/leaderboard") != std::string::npos) {
            response = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n";
            response += R"([{"rank":1,"name":"Sarah","score":5},{"rank":2,"name":"Michael","score":5},{"rank":3,"name":"Emily","score":4}])";
        }
        else if (request.find("GET /api/recommend") != std::string::npos) {
            response = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n";
            response += readFile("recommend.json");
            if (response.find("[]") != std::string::npos) {
                response.replace(response.find("[]"), 2, R"([{"id":1,"title":"Movie 1","genre":"Action"},{"id":2,"title":"Movie 2","genre":"Comedy"}])");
            }
        }
        else if (request.find("OPTIONS") != std::string::npos) {
            response = "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Methods: GET, POST, OPTIONS\r\nAccess-Control-Allow-Headers: Content-Type\r\n\r\n";
        }
        else {
            response = "HTTP/1.1 404 Not Found\r\nContent-Type: application/json\r\n\r\n{\"error\": \"Not found\"}";
        }
        
        send(clientSocket, response.c_str(), response.length(), 0);
    }
    
    closesocket(clientSocket);
}

int main() {
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        std::cerr << "WSAStartup failed!" << std::endl;
        return 1;
    }

    SOCKET serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (serverSocket == INVALID_SOCKET) {
        std::cerr << "Socket creation failed!" << std::endl;
        WSACleanup();
        return 1;
    }

    sockaddr_in serverAddr = {};
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = inet_addr("127.0.0.1");
    serverAddr.sin_port = htons(18080);

    if (bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        std::cerr << "Bind failed!" << std::endl;
        closesocket(serverSocket);
        WSACleanup();
        return 1;
    }

    if (listen(serverSocket, SOMAXCONN) == SOCKET_ERROR) {
        std::cerr << "Listen failed!" << std::endl;
        closesocket(serverSocket);
        WSACleanup();
        return 1;
    }

    std::cout << "Server running on http://localhost:18080" << std::endl;
    std::cout << "Press Ctrl+C to stop the server." << std::endl;

    while (true) {
        sockaddr_in clientAddr = {};
        int clientAddrSize = sizeof(clientAddr);
        
        SOCKET clientSocket = accept(serverSocket, (sockaddr*)&clientAddr, &clientAddrSize);
        if (clientSocket != INVALID_SOCKET) {
            std::thread(handleClient, clientSocket).detach();
        }
    }

    closesocket(serverSocket);
    WSACleanup();
    return 0;
}
