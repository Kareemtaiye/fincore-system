import ProfileRepository from "../repositories/profileRepository.js";

export default class ProfileService {
  static async createUserProfile({ userId, firstName, lastName }, client) {
    return await ProfileRepository.createProfile({ userId, firstName, lastName }, client);
  }
}
