import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { HTTP_MESSAGE, InternalServerErrorResponse, SuccessResponse, BadRequestResponse, UnauthorizedResponse } from '../../../../helpers/http.js';
import { JWT_EXPIRES_IN, JWT_SECRET } from '../../../../config/env.config.js';
import Admin from '../../../../models/admin.js';
import System from '../../../../models/system.js';
import { createToken } from '../../../../helpers/token.js';
import { findOne, insertQuery, update } from '../../../../helpers/crudMongo.js';

//Function For Admin Login Api 
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    const details = await findOne("Admin", { username: username });
    if (!details) {
      return BadRequestResponse(res, HTTP_MESSAGE.NOT_FOUND);
    }

    const match = await bcrypt.compare(password, details.password);
    if (!match) {
      return UnauthorizedResponse(res, HTTP_MESSAGE.WRONG_PASSWORD);
    }

    const id = details._id;
    const deviceId = "";
    const roles = details.role;
    const query = { id };
    const token = await createToken(id, deviceId, roles, query);
    return SuccessResponse(res, HTTP_MESSAGE.LOGIN, { token });

  } catch (err) {
    return InternalServerErrorResponse(res, HTTP_MESSAGE.INTERNAL_SERVER_ERROR, err);
  }
};

//Function For Admin View Profile Api
const adminProfile = async (req, res) => {
  try {
    const { adminId } = req.query;
    const details = await findOne("Admin", { _id: adminId });
    if (!details) {
      return BadRequestResponse(res, HTTP_MESSAGE.NOT_FOUND);
    }
    return SuccessResponse(res, HTTP_MESSAGE.ADMIN_PROFILE, { details });
  } catch (err) {
    return InternalServerErrorResponse(res, HTTP_MESSAGE.INTERNAL_SERVER_ERROR, err);
  }
};

//Function For Admin Chang Password Api
const changePassword = async (req, res) => {
  try {
    const { adminId, password } = req.body;
    const details = await findOne("Admin", { _id: adminId });
    if (!details) {
      return BadRequestResponse(res, HTTP_MESSAGE.NOT_FOUND);
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const updateData = {
      password: hashedPassword,
      knowPassword: password, 
    };

    const updatedDetails = await update("Admin", { _id: adminId }, updateData, "findOneAndUpdate");
    return SuccessResponse(res, HTTP_MESSAGE.PASSWORD_CHANGE, { details: updatedDetails });

  } catch (err) {
    return InternalServerErrorResponse(res, HTTP_MESSAGE.INTERNAL_SERVER_ERROR, err);
  }
};

//Function For Admin Created Employee Api
const createEmployee = async (req, res) => {
  try {
    const { adminId, employeeName, username, password, designation, permission } = req.body;
    const details = await findOne("Admin", { _id: adminId });
    if (!details) {
      return BadRequestResponse(res, HTTP_MESSAGE.NOT_FOUND);
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const employeeDetails = {
      employeeName,
      username,
      password: hashedPassword,
      knowPassword: password,
      designation,
      permission,
      role: "SUBADMIN"
    };

    await insertQuery("Admin", employeeDetails);

    // Exclude password and knowPassword from the response
    const responseDetails = {
      employeeName,
      username,
      designation,
      permission,
      role: "SUBADMIN"
    };

    return SuccessResponse(res, HTTP_MESSAGE.CREATED_EMPLOGEE, { details: responseDetails });

  } catch (err) {
    return InternalServerErrorResponse(res, HTTP_MESSAGE.INTERNAL_SERVER_ERROR, err);
  }
};

//Function For Admin Block Employee api
const blockEmployee = async (req, res) => {
  try {
    const { adminId, empId } = req.body;

    const details = await findOne("Admin", { _id: adminId });
    if (!details) {
      return BadRequestResponse(res, HTTP_MESSAGE.NOT_FOUND);
    }

    const empDetails = await findOne("Admin", { _id: empId });
    if (!empDetails) {
      return BadRequestResponse(res, HTTP_MESSAGE.NOT_FOUND);
    }
    const updateData = {
      isBlock: true
    };
    const updatedDetails = await update("Admin", { _id: empId }, updateData, "findOneAndUpdate");
    return SuccessResponse(res, HTTP_MESSAGE.BLOCK_EMPLOYEE, { details: updatedDetails });
  } catch (err) {
    return InternalServerErrorResponse(res, HTTP_MESSAGE.INTERNAL_SERVER_ERROR, err);
  }
};

//Function For List Of Employee api
const empList = async (req, res) => {
  try {
    const { adminId } = req.query;

    const details = await findOne("Admin", { _id: adminId });
    if (!details) {
      return BadRequestResponse(res, HTTP_MESSAGE.NOT_FOUND);
    }

    // Aggregate pipeline to exclude documents with role 'ADMIN' and exclude password and knowPassword fields
    const list = await Admin.aggregate([
      { $match: { role: { $ne: 'ADMIN' } } },
      { $project: { password: 0, knowPassword: 0 } }
    ]);

    return SuccessResponse(res, HTTP_MESSAGE.EMP_LIST, { details: list });

  } catch (err) {
    return InternalServerErrorResponse(res, HTTP_MESSAGE.INTERNAL_SERVER_ERROR, err);
  }
};

//First Time Add The System Info
const addSystemInfo = async (req, res) => {
  try {
    const { adminId, text } = req.body;
    const details = await findOne("Admin", { _id: adminId });
    if (!details) {
      return BadRequestResponse(res, HTTP_MESSAGE.NOT_FOUND);
    }

    const logo = req.files?.logo ? req.files.logo[0].location : null;
    const fabIcon = req.files?.fabIcon ? req.files.fabIcon[0].location : null;
    const backgroundImage = req.files?.backgroundImage ? req.files.backgroundImage[0].location : null;

    const newData = {
      adminId,
      text,
      logo,
      fabIcon,
      backgroundImage,
    };

    const newDetails = await insertQuery("System", newData);
    return SuccessResponse(res, HTTP_MESSAGE.EMP_ADDED, { details: newDetails });

  } catch (err) {
    return InternalServerErrorResponse(res, HTTP_MESSAGE.INTERNAL_SERVER_ERROR, err);
  }
};

//Update System Info
const updateSystemInfo = async (req, res) => {
  try {
    const { adminId,systemInfoId,text } = req.body;
    const details = await findOne("Admin", { _id: adminId });
    if (!details) {
      return BadRequestResponse(res, HTTP_MESSAGE.NOT_FOUND);
    }
    const systemInfo =await findOne("System", { _id: systemInfoId });
    if (!systemInfo) {
      return BadRequestResponse(res, HTTP_MESSAGE.NOT_FOUND);
    }
    const logo = req.files?.logo ? req.files.logo[0].location : null;
    const fabIcon = req.files?.fabIcon ? req.files.fabIcon[0].location : null;
    const backgroundImage = req.files?.backgroundImage ? req.files.backgroundImage[0].location : null;

    
    const updateData = {
      adminId,
      text,
      logo,
      fabIcon,
      backgroundImage,
    };

    const updatedDetails = await update("System", { _id: systemInfoId }, updateData, "findOneAndUpdate");
    return SuccessResponse(res, HTTP_MESSAGE.EMP_LIST, { details: updatedDetails });

  } catch (err) {
    return InternalServerErrorResponse(res, HTTP_MESSAGE.INTERNAL_SERVER_ERROR, err);
  }
};

export { adminLogin, adminProfile, changePassword, createEmployee, blockEmployee, empList,addSystemInfo, updateSystemInfo };
