#ifndef USER_PROFILE_H
#define USER_PROFILE_H
#include "json.hpp"
using json=nlohmann::json;
using namespace std;

void viewProfile(const json& user);
void editProfile(json& user);
void update_password(json &user);
void delete_account(json &user);

#endif