import User from '../models/userModel.mjs';

class UserRepository {
  createUser(userData) {
    return new Promise((resolve, reject) => {
      const user = new User(userData);
      user.save()
        .then(savedUser => resolve(savedUser))
        .catch(error => reject(error));
    });
  }

  findUserByEmail(email) {
    return new Promise((resolve, reject) => {
      User.findOne({ email })
        .then(user => {
          if (!user) {
            return resolve(false);
          }
          resolve(user);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  getUsersWithoutRole(role) {
    return new Promise(async (resolve, reject) => {
      try {
        const usersWithoutRole = await User.find({ role: { $ne: role } }).select('-role');

        resolve(usersWithoutRole);
      } catch (error) {
        reject(new Error('Error getting users without role from database'));
      }
    });
  }

  getUserById(userId) {
    return new Promise((resolve, reject) => {
      User.findById(userId)
        .then(user => {
          if (!user) {
            return reject(new Error('User not found'));
          }
          resolve(user);
        })
        .catch(error => reject(error));
    });
  }

  getAllUsers() {
    return new Promise((resolve, reject) => {
      User.find()
        .then(users => resolve(users))
        .catch(error => reject(error));
    });
  }

  updateUser(email, updateData) {
    return new Promise((resolve, reject) => {
      User.findOneAndUpdate({ email }, updateData, { new: true })
        .then(updatedUser => {
          if (!updatedUser) {
            return reject(new Error('User not found'));
          }
          resolve(updatedUser);
        })
        .catch(error => reject(error));
    });
  }


}

export default UserRepository;