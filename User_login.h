#ifndef USER_LOGIN_H
#define USER_LOGIN_H
#include <string>
using namespace std;
string SHA_256(const string& str);
int exists(const string& uname,const string& pass);
void login(const string& uname,const string& pass);
void registerUser(const string& uname,const string& pass);
#endif