#ifndef RECOMMENDATION_H
#define RECOMMENDATION_H

#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>

class recommendation {
private:
    // Local user → set of genres they like
    std::unordered_map<std::string, std::unordered_set<std::string>> userLikes;

public:
    // ----- JSON backup (optional) -----
    void savetoJSON();
    void loadfromJSON();

    // ----- User management -----
    void addUser(const std::string& username,
                 const std::unordered_set<std::string>& genres);

    void addUserGenre(const std::string& username,
                      const std::string& genre);

    void removeUser(const std::string& username);
    void removeUserGenre(const std::string& username,
                         const std::string& genre);

    bool userExists(const std::string& username);
    void getUserGenre(const std::string& username);

    // ----- Local media helpers (unused when using backend) -----
    void addMediaGenre(const std::string& mediaType,
                       const std::string& genre,
                       const std::unordered_set<std::string>& items);

    void addMediaItem(const std::string& mediaType,
                      const std::string& genre,
                      const std::string& item);

    // ----- Live fetch from Node backend -----
    std::vector<std::string> fetchItemsFromAPI(const std::string& mediaType,
                                               const std::string& genre);

    // ----- Recommendation engine -----
    std::vector<std::string> recommend(const std::string& username,
                                       const std::string& mediaType);

    // ----- Display pretty results -----
    void displayRecommendations(const std::string& username,
                                const std::string& mediaType);
};

#endif
