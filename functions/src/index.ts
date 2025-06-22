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
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

initializeApp();

/**
 * Creates a new draft.
 * Method: POST
 * Path: /createDraft
 * Body: { name: string, topic: string }
 */
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

/**
 * Retrieves a draft by its ID.
 * Method: GET
 * Path: /getDraft/{draftId}
 */
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
        response.status(200).json({draftId: docSnap.id, ...docSnap.data()});
      } else {
        response.status(404).send("Draft not found");
      }
    } catch (error) {
      logger.error("Error retrieving draft:", error);
      response.status(500).send("Internal Server Error");
    }
  });

/**
 * Starts a draft.
 * Method: POST
 * Path: /startDraft/{draftId}
 */
export const startDraft = onRequest(
  {cors: true},
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

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
        await docRef.update({isActive: true});
        response.status(200).json({
          draftId: docSnap.id,
          ...docSnap.data(),
          isActive: true,
        });
      } else {
        response.status(404).send("Draft not found");
      }
    } catch (error) {
      logger.error("Error starting draft:", error);
      response.status(500).send("Internal Server Error");
    }
  },
);

/**
 * Ends a draft.
 * Method: POST
 * Path: /endDraft/{draftId}
 */
export const endDraft = onRequest(
  {cors: true},
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

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
        await docRef.update({isActive: false});
        response.status(200).json({
          draftId: docSnap.id,
          ...docSnap.data(),
          isActive: false,
        });
      } else {
        response.status(404).send("Draft not found");
      }
    } catch (error) {
      logger.error("Error ending draft:", error);
      response.status(500).send("Internal Server Error");
    }
  },
);

/**
 * Adds a participant to a draft.
 * Method: POST
 * Path: /addParticipant/{draftId}
 * Body: { participant: { name: string, userId: string } }
 */
export const addParticipant = onRequest(
  {cors: true},
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    const {participant} = request.body;

    if (!participant || !participant.name || !participant.userId) {
      response.status(400).send("Missing participant name or userId");
      return;
    }

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
        await docRef.update({
          participants: FieldValue.arrayUnion(participant),
        });

        const updatedDoc = await docRef.get();

        response.status(200).json({
          draftId: updatedDoc.id,
          ...updatedDoc.data(),
        });
      } else {
        response.status(404).send("Draft not found");
      }
    } catch (error) {
      logger.error("Error adding participant:", error);
      response.status(500).send("Internal Server Error");
    }
  },
);


