import { ServerSentEvent } from "@/models/server_sent_event"

const sseDecoder = (stream: string): Array<ServerSentEvent> => {
    const lines = stream.split("\n");
    const events: Array<ServerSentEvent> = [];
    if (!stream.trim()) return events;

    for (const line of lines) {
        if (line.startsWith("data:")) {
            const data = line.substring(5).trim();
            events.push({ 
                data: data,
                finished: data === "[DONE]",
            } as ServerSentEvent);
        }
    }

    return events;
};

export {
    sseDecoder,
};