/* tslint:disable */
/* eslint-disable */
/**
 * Blog API
 * A simple blog API built with Go and Gin
 *
 * The version of the OpenAPI document: 1.0
 * Contact: support@swagger.io
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { mapValues } from "../runtime";
/**
 *
 * @export
 * @interface HandlersLivenessResponse
 */
export interface HandlersLivenessResponse {
  /**
   *
   * @type {string}
   * @memberof HandlersLivenessResponse
   */
  status?: string;
  /**
   *
   * @type {string}
   * @memberof HandlersLivenessResponse
   */
  timestamp?: string;
}

/**
 * Check if a given object implements the HandlersLivenessResponse interface.
 */
export function instanceOfHandlersLivenessResponse(
  value: object,
): value is HandlersLivenessResponse {
  return true;
}

export function HandlersLivenessResponseFromJSON(
  json: any,
): HandlersLivenessResponse {
  return HandlersLivenessResponseFromJSONTyped(json, false);
}

export function HandlersLivenessResponseFromJSONTyped(
  json: any,
  ignoreDiscriminator: boolean,
): HandlersLivenessResponse {
  if (json == null) {
    return json;
  }
  return {
    status: json["status"] == null ? undefined : json["status"],
    timestamp: json["timestamp"] == null ? undefined : json["timestamp"],
  };
}

export function HandlersLivenessResponseToJSON(
  json: any,
): HandlersLivenessResponse {
  return HandlersLivenessResponseToJSONTyped(json, false);
}

export function HandlersLivenessResponseToJSONTyped(
  value?: HandlersLivenessResponse | null,
  ignoreDiscriminator: boolean = false,
): any {
  if (value == null) {
    return value;
  }

  return {
    status: value["status"],
    timestamp: value["timestamp"],
  };
}
