/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import {onRequest} from "firebase-functions/v2/https";
// import {onDocumentCreated} from "firebase-functions/v2/firestore";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

initializeApp();

export const createDraft = onRequest(
  {cors: true},
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    const {name, topic} = request.body;

    if (!name || !topic) {
      response.status(400).send("Missing name or topic");
      return;
    }

    try {
      const firestore = getFirestore();
      const newDraft = {
        name,
        topic,
        currentTurn: "",
        isActive: false,
        participants: [],
        picks: [],
      };

      const docRef = await firestore.collection("drafting").add(newDraft);

      response.status(201).send({
        ...newDraft,
        draftId: docRef.id,
      });
    } catch (error) {
      logger.error("Error creating draft:", error);
      response.status(500).send("Internal Server Error");
    }
  });

export const getDraft = onRequest(
  {cors: true},
  async (request, response) => {
    if (request.method !== "GET") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    // The draft ID is expected to be in the URL path, like /getDraft/{draftId}
    const draftId = request.path.split("/").pop();

    if (!draftId) {
      response.status(400).send("Draft ID is missing in the URL.");
      return;
    }

    try {
      const firestore = getFirestore();
      const docRef = firestore.collection("drafting").doc(draftId);
      const docSnap = await docRef.get();

      if (docSnap.exists) {
        response.status(200).json({id: docSnap.id, ...docSnap.data()});
      } else {
        response.status(404).send("Draft not found");
      }
    } catch (error) {
      logger.error("Error retrieving draft:", error);
      response.status(500).send("Internal Server Error");
    }
  });


