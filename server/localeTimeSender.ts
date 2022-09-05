import type { Request, Response, NextFunction } from "express";
import type { localeTimeSenderParams } from "../common/types";

export function setupLocaleTimeSenderSSEMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const sendLocaleTimeViaSSE = (
    timeSenderResponse: localeTimeSenderParams["time"]
  ) => {
    const sseFormattedResponse = `data: ${JSON.stringify(
      timeSenderResponse
    )}\n\n`;
    res.write(sseFormattedResponse);
  };

  // NOTE: We are attaching sendLocaleTimeViaSSE to Express' Response object, so we can use it later
  Object.assign(res, {
    sendLocaleTimeViaSSE,
  });

  next();
}

export function attachLocaleTimeSenderInterval(_req: Request, res: Response) {
  const timerInterval = setInterval(() => {
    res.sendLocaleTimeViaSSE({
      time: new Date().toLocaleTimeString(),
    });
  }, 1000);

  res.on("close", () => {
    clearInterval(timerInterval);
    res.end();
  });
}
