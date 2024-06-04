import Token from "../models/tokenModel.mjs";

class TokenRepository {
  storeRefreshToken(userId, refreshToken) {
    return new Promise((resolve, reject) => {
      Token.create({ userId, token: refreshToken })
        .then(token => resolve(token))
        .catch(error => reject(error));
    });
  }

  findTokenByUserIdAndToken(userId, token) {
    return new Promise((resolve, reject) => {
      Token.findOne({ userId, token })
        .then(token => resolve(token))
        .catch(error => reject(error));
    });
  }
}

export default TokenRepository;
