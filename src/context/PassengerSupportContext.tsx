import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  initialSupportTickets,
} from "../data/passengerSupport";

import type {
  CreateSupportTicketInput,
  SupportTicket,
} from "../types/passengerSupport";

interface PassengerSupportContextValue {
  tickets:
    SupportTicket[];

  createTicket: (
    input:
      CreateSupportTicketInput,
  ) => SupportTicket;

  sendMessage: (
    ticketId: string,
    message: string,
  ) => void;

  resolveTicket: (
    ticketId: string,
  ) => void;

  escalateTicket: (
    ticketId: string,
  ) => void;

  getTicket: (
    ticketId: string,
  ) =>
    | SupportTicket
    | undefined;
}

const PassengerSupportContext =
  createContext<
    PassengerSupportContextValue
    | undefined
  >(undefined);

export function PassengerSupportProvider({
  children,
}: {
  children:
    React.ReactNode;
}) {
  const [
    tickets,
    setTickets,
  ] =
    useState<
      SupportTicket[]
    >(
      initialSupportTickets,
    );

  const createTicket =
    useCallback(
      (
        input:
          CreateSupportTicketInput,
      ) => {
        const timestamp =
          new Date()
            .toISOString();

        const number =
          2050 +
          tickets.length;

        const ticket:
          SupportTicket =
          {
            id:
              `ticket-${Date.now()}`,

            reference:
              `TR-${number}`,

            summary:
              input.summary,

            description:
              input.description,

            rideId:
              input.rideId,

            priority:
              input.priority,

            status:
              "open",

            escalated:
              false,

            createdAt:
              timestamp,

            updatedAt:
              timestamp,

            messages: [
              {
                id:
                  `message-${Date.now()}`,

                sender:
                  "passenger",

                message:
                  `${input.summary}\n\n${input.description}`,

                createdAt:
                  timestamp,
              },
            ],
          };

        setTickets(
          (
            previous,
          ) => [
            ticket,
            ...previous,
          ],
        );

        return ticket;
      },
      [tickets.length],
    );

  const sendMessage =
    useCallback(
      (
        ticketId:
          string,
        message:
          string,
      ) => {
        const trimmed =
          message.trim();

        if (!trimmed) {
          return;
        }

        setTickets(
          (
            previous,
          ) =>
            previous.map(
              (
                ticket,
              ) => {
                if (
                  ticket.id !==
                    ticketId ||
                  ticket.status ===
                    "closed"
                ) {
                  return ticket;
                }

                const now =
                  new Date()
                    .toISOString();

                return {
                  ...ticket,

                  updatedAt:
                    now,

                  messages: [
                    ...ticket.messages,

                    {
                      id:
                        `message-${Date.now()}`,

                      sender:
                        "passenger",

                      message:
                        trimmed,

                      createdAt:
                        now,
                    },
                  ],
                };
              },
            ),
        );
      },
      [],
    );

  const resolveTicket =
    useCallback(
      (
        ticketId:
          string,
      ) => {
        setTickets(
          (
            previous,
          ) =>
            previous.map(
              (
                ticket,
              ) =>
                ticket.id ===
                ticketId
                  ? {
                      ...ticket,

                      status:
                        "closed",

                      updatedAt:
                        new Date()
                          .toISOString(),
                    }
                  : ticket,
            ),
        );
      },
      [],
    );

  const escalateTicket =
    useCallback(
      (
        ticketId:
          string,
      ) => {
        setTickets(
          (
            previous,
          ) =>
            previous.map(
              (
                ticket,
              ) => {
                if (
                  ticket.id !==
                    ticketId ||
                  ticket.status ===
                    "closed" ||
                  ticket.escalated
                ) {
                  return ticket;
                }

                const now =
                  new Date()
                    .toISOString();

                return {
                  ...ticket,

                  escalated:
                    true,

                  priority:
                    "high",

                  updatedAt:
                    now,

                  messages: [
                    ...ticket.messages,

                    {
                      id:
                        `system-${Date.now()}`,

                      sender:
                        "system",

                      message:
                        "⚠️ This ticket has been escalated for urgent attention.",

                      createdAt:
                        now,
                    },
                  ],
                };
              },
            ),
        );
      },
      [],
    );

  const getTicket =
    useCallback(
      (
        ticketId:
          string,
      ) =>
        tickets.find(
          (
            ticket,
          ) =>
            ticket.id ===
            ticketId,
        ),
      [tickets],
    );

  const value =
    useMemo(
      () => ({
        tickets,
        createTicket,
        sendMessage,
        resolveTicket,
        escalateTicket,
        getTicket,
      }),
      [
        tickets,
        createTicket,
        sendMessage,
        resolveTicket,
        escalateTicket,
        getTicket,
      ],
    );

  return (
    <PassengerSupportContext.Provider
      value={value}
    >
      {children}
    </PassengerSupportContext.Provider>
  );
}

export function usePassengerSupport() {
  const context =
    useContext(
      PassengerSupportContext,
    );

  if (!context) {
    throw new Error(
      "usePassengerSupport must be used inside PassengerSupportProvider",
    );
  }

  return context;
}