import { randomBytes } from "crypto";
import { connect, JetStreamClient, NatsConnection, Events } from "nats";

class NatsWrapper {
    private _client?: JetStreamClient; // ? means that it can be undefined sometimes
    get client() {
        if (!this._client) {
            throw new Error("Cannot access nats before connecting");
        }
        return this._client;
    }

    async connect(): Promise<void> {
        const connection: NatsConnection = await connect({ servers: ["nats-srv-1:4222", "nats-srv-2:4222", "nats-srv-3:4222"], name: randomBytes(4).toString("hex") });
        this._client = connection.jetstream();
        // const jsm = await connection.jetstreamManager();
        // await jsm.streams.add({ name: "phoenix", subjects: ["phoenix.*"] });
        console.info("Connected to NATS JetStream");

        (async () => {
            for await (const s of connection.status()) {
                switch (s.type) {
                    case Events.Reconnect:
                        console.info(`NATS client reconnected - ${s.data}`);
                        break;
                    case Events.Disconnect:
                        console.info(`NATS client disconnect - ${s.data}`);
                        break;
                    case Events.Error:
                        console.info(`NATS client error - ${s.data}`);
                        break;
                    default:
                }
            }
        })().then();
    }
}

export const natsWrapper = new NatsWrapper();
