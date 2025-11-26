#ifndef USER_PROFILE_H
#define USER_PROFILE_H

#include <string>
#include "json.hpp"
using json = nlohmann::json;
using namespace std;

string currentDateTime();

// filename is ignored now but kept for compatibility
void viewProfile(const string& filename, const string& username);
void editProfile(const string& filename, string& username);
void update_password(const string& filename, const string& username);
void delete_account(const string& filename, const string& username);

#endif
