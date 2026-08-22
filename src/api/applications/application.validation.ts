import { body } from "express-validator";

export const createApplicationValidation = [
  body("jobId")
    .exists()
    .withMessage("jobId is required")
    .bail()
    .isString()
    .withMessage("jobId must be a string")
    .trim()
    .notEmpty()
    .withMessage("jobId cannot be empty"),

  body("candidateId")
    .exists()
    .withMessage("candidateId is required")
    .bail()
    .isString()
    .withMessage("candidateId must be a string")
    .trim()
    .notEmpty()
    .withMessage("candidateId cannot be empty"),

  body("recruiterId")
    .exists()
    .withMessage("recruiterId is required")
    .bail()
    .isString()
    .withMessage("recruiterId must be a string")
    .trim()
    .notEmpty()
    .withMessage("recruiterId cannot be empty"),

  body("coverLetter")
    .exists()
    .withMessage("coverLetter is required")
    .bail()
    .isString()
    .withMessage("coverLetter must be a string")
    .trim()
    .notEmpty()
    .withMessage("coverLetter cannot be empty"),
];