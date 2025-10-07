#include<iostream>
#include<fstream>
#include<string>
#include "Leaderboard.h"
#include "json.hpp"
using json=nlohmann::json;


Leaderboard::Leaderboard(const string& file):filename(file){
    load();
}

void Leaderboard::load(){
    ifstream getboard(filename);
    if(!getboard){
        cout<<"ERROR OPENING FILE!!"<<endl;
        return;
    }
    try{  
        json data;
        getboard>>data;
        entries.clear();
        for(auto& user: data){
            entries.push_back({user["Username"],user["Score"]});
        }
        getboard.close();
        sortDescending();
        cout<<"Leaderboard Loaded Successfully!!"<<endl;
    }
    catch (const nlohmann::json::parse_error& e) {
        cerr << "JSON parse error: " << e.what() << endl;
    }
    catch (const std::out_of_range& e) {
        cerr << "JSON key error: " << e.what() << endl;
    }
    catch (const nlohmann::json::type_error& e) {
        cerr << "JSON type error: " << e.what() << endl;
    }
    catch (const std::exception& e) {
        cerr << "Error: " << e.what() << endl;
    }
    catch (...) {
        cerr << "Unknown error occurred." << endl;
    }
}

void Leaderboard::save(){
    try
    {
        ofstream saveboard(filename);
        if(!saveboard){
            cout<<"!!ERROR OPENING FILE!!"<<endl;
            return;
        }
        json data=json::array();
        for(auto& entry:entries){
            data.push_back({{"Username",entry.name},{"Score",entry.score}});
        }
        saveboard<<data.dump(4);
        saveboard.close();
    }
    catch(const nlohmann::json::parse_error& e){
        cerr<<"JSON Parse Error: "<<e.what()<<endl;
    }
    catch(const nlohmann::json::type_error& e){
        cerr<<"JSON Type Error: "<<e.what()<<endl;
    }
    catch(const std::out_of_range& e){
        cerr<<"JSON Key Error"<<e.what()<<endl;
    }
    catch(const std::exception& e){
        cerr<<"Error: "<<e.what()<<endl;
    }
    catch(...){
        cerr<<"Unknown Error Occurred!"<<endl;
    }
    
}