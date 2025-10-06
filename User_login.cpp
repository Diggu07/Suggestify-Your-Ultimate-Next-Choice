#include<iostream>
#include<fstream>
#include "json.hpp"
#include "User_login.h"
using namespace std;
using json = nlohmann::json;

#include <iomanip>
#include <sstream>
#include <openssl/sha.h>

string SHA_256(const string &str) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256_CTX SHA_256;
    SHA256_Init(&SHA_256);
    SHA256_Update(&SHA_256, str.c_str(), str.size());
    SHA256_Final(hash, &SHA_256);

    stringstream ss;
    for(int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        ss << hex << setw(2) << setfill('0') << (int)hash[i];
    }
    return ss.str();
}

int exists(string& user_name,string& user_pass){
    ifstream user_get("Users.json");
    if(!user_get){
        cout<<"ERROR OPENING FILE!";
        return INT16_MIN;
    }
    json Data;
    user_get>>Data;
    for(auto &user_obj:Data["users"]){
        string hashed_pass=SHA_256(user_pass);
        if((user_obj["Username"]==user_name)&&(user_obj["Password"]==hashed_pass))
            return 1;
    }
    user_get.close();
    return 0;
}

void registerUser(string& user_name,string& user_pass){
    json data;
    ifstream user_get("Users.json");
    if(!user_get){
        data["users"] = json::array();
    }
    else{
        user_get>>data;
        user_get.close();
    }
    string hashed_pass=SHA_256(user_pass);
    
    ofstream user_write("Users.json");
    if(!user_write){
        cout<<"ERROR OPENING FILE!";
        return;
    }
    data["users"].push_back({{"Username",user_name},{"Password",hashed_pass}});
    user_write<<data.dump(4);
    user_write.close();
}

void login(string& user_name,string& user_pass){
    if(exists(user_name,user_pass)){
        cout<<"Login Successful!!";
        return;
    }
    cout<<"Wrong Username or/and Password! Please register.";
    registerUser(user_name,user_pass);
}