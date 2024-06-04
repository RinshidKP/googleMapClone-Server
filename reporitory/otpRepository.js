import OtpModel from "../models/otpModel.js";

class OtpRepository {
  createOtp(otpData) {
    return new Promise((resolve, reject) => {
      const otp = new OtpModel(otpData);
      otp.save()
        .then(savedOtp => resolve(savedOtp))
        .catch(error => reject(error));
    });
  }

  findOtpByEmail(email) {
    return new Promise((resolve, reject) => {
      OtpModel.findOne({ email })
        .then(otp => {
          if (!otp) {
            return resolve(false);
          }
          resolve(otp);
        })
        .catch(error => reject(error));
    });
  }
  

  deleteOtpByEmail(email) {
    return new Promise((resolve, reject) => {
      OtpModel.findOneAndDelete({ email })
        .then(deletedOtp => {
          if (!deletedOtp) {
            return resolve(false)
          }
          resolve(deletedOtp);
        })
        .catch(error => reject(error));
    });
  }
}

export default OtpRepository;
