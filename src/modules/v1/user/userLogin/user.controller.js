import { findOne, insertQuery, update } from "../../../../helpers/crudMongo.js";
import {
  BadRequestResponse,
  HTTP_MESSAGE,
  InternalServerErrorResponse,
  SuccessResponse,
} from "../../../../helpers/http.js";
import { GameSetting } from "../../../../models/gameSetting.js";
import { HowToPlay } from "../../../../models/howToPlay.js";
import { Users } from "../../../../models/users.js";
import jwt from "jsonwebtoken";

const checkUser = async (req, res) => {
  try {
    const { deviceId } = req.body;
    let checkUserInfo = await Users.findOne({ deviceId,isRegister:true });
    if (checkUserInfo) return SuccessResponse(res, HTTP_MESSAGE.USR_EXIST);
    let checkuserwitoutregister= await Users.findOne({ deviceId,isRegister:false });
    if(checkuserwitoutregister) await Users.deleteOne({deviceId})
    let checkUser = await Users.findOne({ deviceId}); 
    if (!checkUser) return BadRequestResponse(res, HTTP_MESSAGE.USER_NOT_EXIST);
  } catch (err) {
    return BadRequestResponse(res, HTTP_MESSAGE.INTERNAL_SERVER_ERROR, err);
  }
};

const getOtp = async (req, res) => {
  try {
    const { mobile, deviceId } = req.body;
    const otp = 1234;
    const userDetails = await findOne("Users", { mobile });

    if (userDetails) return BadRequestResponse(res, HTTP_MESSAGE.USER_EXIST);
    const userInfo = { otp, mobile, deviceId };
    const data = await insertQuery("Users", userInfo);
    return SuccessResponse(res, HTTP_MESSAGE.OTP_SEND, { details: data });
  } catch (err) {
    return InternalServerErrorResponse(
      res,
      HTTP_MESSAGE.INTERNAL_SERVER_ERROR,
      err
    );
  }
};

const varifiedOtp = async (req, res) => {
  try {
    const { deviceId, otp } = req.body;
    const userDetails = await findOne("Users", { deviceId });
    if (!userDetails) return BadRequestResponse(res, HTTP_MESSAGE.USER_NOT_FND);
    if (userDetails.otp !== otp)
      return BadRequestResponse(res, HTTP_MESSAGE.PLEASE_ENTER_VALID_OTP);
    if (userDetails.otp === otp) {
      await Users.updateOne({ deviceId }, { $set: { isVerified: true } });
      return SuccessResponse(res, HTTP_MESSAGE.OTP_VARIFIED);
    }
  } catch (err) {
    return InternalServerErrorResponse(
      res,
      HTTP_MESSAGE.INTERNAL_SERVER_ERROR,
      err
    );
  }
};

const setMpin = async (req, res) => {
  try {
    const { deviceId, mpin } = req.body;
    const userDetails = await findOne("Users", { deviceId });

    if (!userDetails) return BadRequestResponse(res, HTTP_MESSAGE.USER_NOT_FND);
    await Users.updateOne({ deviceId: deviceId }, { $set: { mpin } });
    return SuccessResponse(res, HTTP_MESSAGE.MPIN_SET_SUCCESSFULLY);
  } catch (err) {
    return InternalServerErrorResponse(
      res,
      HTTP_MESSAGE.INTERNAL_SERVER_ERROR,
      err
    );
  }
};

const signup = async (req, res) => {
  try {
    const { deviceId, name, language, city, state } = req.body;
    const userDetails = await findOne("Users", { deviceId });
    if (!userDetails)
      return BadRequestResponse(res, HTTP_MESSAGE.USER_NOT_FND);
    if (userDetails.isVerified === false)
      return BadRequestResponse(res, HTTP_MESSAGE.PLEASE_VERIFY_ACCOUNT);
    const userObj = { name, language, city, state, isRegister:true };

    await Users.updateOne({ deviceId }, { $set: userObj });

    return SuccessResponse(res, HTTP_MESSAGE.USER_REGISTER);
  } catch (err) {
    return InternalServerErrorResponse(
      res,
      HTTP_MESSAGE.INTERNAL_SERVER_ERROR,
      err
    );
  }
};

const forgotMpinSendOtp = async (req, res) => {
  try {
    const { deviceId, mobile } = req.body;
    const userDetails = await findOne("Users", { deviceId });
    if (!userDetails) return BadRequestResponse(res, HTTP_MESSAGE.USER_NOT_FND);
    const checkMobile = await findOne("Users", { mobile: mobile });
    if (!checkMobile)
      return BadRequestResponse(res, HTTP_MESSAGE.MOBILE_NOT_FOUND);

    const otp = 1234;
    const info = await Users.updateOne(
      { deviceId: deviceId },
      { $set: { otp } }
    );
    return SuccessResponse(res, HTTP_MESSAGE.OTP_SEND);
  } catch (err) {
    return InternalServerErrorResponse(
      res,
      HTTP_MESSAGE.INTERNAL_SERVER_ERROR,
      err
    );
  }
};

const forgotPasswordVerifyOtp = async (req, res) => {
  try {
    const { deviceId, otp } = req.body;
    const userDetails = await findOne("Users", { deviceId });
    if (!userDetails) return BadRequestResponse(res, HTTP_MESSAGE.USER_NOT_FND);

    if (userDetails.otp !== otp) {
      return BadRequestResponse(res, HTTP_MESSAGE.OTP_NOT_VARIFIED);
    }

    return SuccessResponse(res, HTTP_MESSAGE.OTP_VARIFIED);
  } catch (err) {
    return InternalServerErrorResponse(
      res,
      HTTP_MESSAGE.INTERNAL_SERVER_ERROR,
      err
    );
  }
};

const updateMpin = async (req, res) => {
  try {
    const { deviceId, oldMpin, newMpin } = req.body;
    const findUser = await Users.findOne({ deviceId });
    if(!findUser)
      return BadRequestResponse(res, HTTP_MESSAGE.USER_NOT_EXIST);
    if (findUser.mpin !== oldMpin)
      return BadRequestResponse(res, HTTP_MESSAGE.PLEASE_ENTER_VALID_MPIN);
    await Users.findOneAndUpdate({ deviceId }, { $set: { mpin: newMpin } });
    return SuccessResponse(res, HTTP_MESSAGE.NEW_MPIN_UPDATE_SUCCESS);
  } catch (err) {
    return InternalServerErrorResponse(
      res,
      HTTP_MESSAGE.INTERNAL_SERVER_ERROR,
      err
    );
  }
};

const userPrfile = async (req, res) => {
  try {
    const { userId } = req.query;
    const userDetails = await findOne("Users", { _id: userId },{otp:0,mpin:0});
    if (!userDetails)
      return BadRequestResponse(res, HTTP_MESSAGE.USER_NOT_EXIST);
    return SuccessResponse(res, HTTP_MESSAGE.USER_PROFILE, {
      details: userDetails,
    });
  } catch (err) {
    return InternalServerErrorResponse(
      res,
      HTTP_MESSAGE.INTERNAL_SERVER_ERROR,
      err
    );
  }
};

const upadateUserPrfile = async (req, res) => {
  try {
    const { userId, name, language, city, state } = req.body;
    const userDetails = await findOne("Users", { _id: userId },{mpin:0,otp:0});
    if (!userDetails)
      return BadRequestResponse(res, HTTP_MESSAGE.USER_NOT_FOUND);

    let updateObj = {};
    if (name) updateObj.name = name;
    if (language) updateObj.name = language;
    if (city) updateObj.name = city;
    if (state) updateObj.name = state;

    await Users.updateOne({ _id: userId }, { $set: updateObj });
    return SuccessResponse(res, HTTP_MESSAGE.USER_PROFILE, {
      details: userDetails,
    });
  } catch (err) {
    return InternalServerErrorResponse(
      res,
      HTTP_MESSAGE.INTERNAL_SERVER_ERROR,
      err
    );
  }
};

const htp = async (req, res) => {
  try {
    const { userId } = req.query;
    const userDetails = await findOne("Users", { _id: userId });
    if (!userDetails)
      return BadRequestResponse(res, HTTP_MESSAGE.USER_NOT_FOUND);

    const htpInfo = await HowToPlay.find({});
    return SuccessResponse(res, HTTP_MESSAGE.HTP_RULES, { details: htpInfo });
  } catch (err) {
    return InternalServerErrorResponse(
      res,
      HTTP_MESSAGE.INTERNAL_SERVER_ERROR,
      err
    );
  }
};

const games = async (req, res) => {
  try {
    const { userId, gameType } = req.body;
    const userDetails = await findOne("Users", { _id: userId });
    if (!userDetails)
      return BadRequestResponse(res, HTTP_MESSAGE.USER_NOT_FOUND);

    const openGamesresult = await GameSetting.aggregate([
      { $match: { gameType } },
      { $unwind: "$gameSatingInfo" },
      { $match: { "gameSatingInfo.isClosed": false } },
      {
        $group: {
          _id: "$_id",
          gameType: { $first: "$gameType" },
          providerName: { $first: "$providerName" },
          providerId: { $first: "$providerId" },
          gameSatingInfo: { $push: "$gameSatingInfo" },
        },
      },
    ]);

    return SuccessResponse(res, HTTP_MESSAGE.OPEN_GAME_RESULT, {
      details: openGamesresult,
    });
  } catch (err) {
    return InternalServerErrorResponse(
      res,
      HTTP_MESSAGE.INTERNAL_SERVER_ERROR,
      err
    );
  }
};

export {
  getOtp,
  varifiedOtp,
  signup,
  setMpin,
  userPrfile,
  htp,
  games,
  updateMpin,
  upadateUserPrfile,
  checkUser,
  forgotMpinSendOtp,
  forgotPasswordVerifyOtp,
};
