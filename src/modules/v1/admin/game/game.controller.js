import { findOne, insertQuery } from '../../../../helpers/crudMongo.js';
import { HTTP_MESSAGE, InternalServerErrorResponse, SuccessResponse, BadRequestResponse, UnauthorizedResponse,GAME_PROVIDER_NOT_FOUND } from '../../../../helpers/http.js';
import GameProvider from '../../../../models/GameProvider.js';

//Function For Add Game Provider Api
const addGameProvider = async (req, res) => {
  try {
    const { adminId,providerName, providerResult, resultStatus,  mobile } = req.body;
    const details = await findOne("Admin", { _id: adminId });
    if (!details) {
      return BadRequestResponse(res, HTTP_MESSAGE.USER_NOT_FOUND);
    }

    const gameDetails = {
      providerName,
      providerResult,
      resultStatus,
      mobile
    };

    const data = await insertQuery("GameProvider", gameDetails);
    return SuccessResponse(res, HTTP_MESSAGE.GAME_CREATED, { details: data });

  } catch (err) {
    return InternalServerErrorResponse(res, HTTP_MESSAGE.INTERNAL_SERVER_ERROR, err);
  }
};
//Function For Add Game Provider Api
const deleteGameProvider = async (req, res) => {
  try {
    const { adminId, gameProviderId} = req.body;
    const details = await findOne("Admin", { _id: adminId });
    if (!details) {
      return BadRequestResponse(res, HTTP_MESSAGE.USER_NOT_FOUND);
    };
    const gameProviderdetails = await findOne("GameProvider", { _id: gameProviderId });
    if (!gameProviderdetails) {
      return BadRequestResponse(res, HTTP_MESSAGE.GAME_PROVIDER_NOT_FOUND);
    }

    const deleteResponse = await deleteQuery(
      "GameProvider",
      { _id: gameProviderId },
      "deleteOne"
    );
    return SuccessResponse(res, HTTP_MESSAGE.GAME_PROVIDER_DELETED, deleteResponse);

  } catch (err) {
    return InternalServerErrorResponse(res, HTTP_MESSAGE.INTERNAL_SERVER_ERROR, err);
  }
};

export { addGameProvider }
