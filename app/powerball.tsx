"use client";

import React, { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import { ChartOptions } from "chart.js/auto";
import { AreaChart, Card, LineChart, Title } from "@tremor/react";
import { mock } from "node:test";

const MAX_HISTORY_SIZE = 100;

interface PowerballTicket {
  numbers: number[];
  powerball: number;
}

const generateRandomTicket = (): PowerballTicket => {
  const numbers = Array.from(
    { length: 5 },
    () => Math.floor(Math.random() * 69) + 1
  );
  const powerball = Math.floor(Math.random() * 26) + 1;
  return { numbers, powerball };
};

const calculateWinnings = (
  userTicket: PowerballTicket,
  winningTicket: PowerballTicket,
  winCounts: WinCounts
): number => {
  let matchCount = 0;
  userTicket.numbers.forEach((num) => {
    if (winningTicket.numbers.includes(num)) {
      matchCount++;
    }
  });

  const isPowerballMatched = userTicket.powerball === winningTicket.powerball;

  switch (matchCount) {
    case 5:
      isPowerballMatched ? winCounts.jackpot++ : winCounts.match5++;
      return isPowerballMatched ? 250_000_000 : 1000000; // Jackpot or second prize
    case 4:
      isPowerballMatched ? winCounts.match4Powerball++ : winCounts.match4++;
      return isPowerballMatched ? 50000 : 100; // Match 4 + Powerball or Match 4
    case 3:
      isPowerballMatched ? winCounts.match3Powerball++ : winCounts.match3++;
      return isPowerballMatched ? 100 : 7; // Match 3 + Powerball or Match 3
    case 2:
      isPowerballMatched ? winCounts.match2Powerball++ : 0;
      return isPowerballMatched ? 7 : 0; // Match 2 + Powerball
    case 1:
      isPowerballMatched ? winCounts.match1Powerball++ : 0;
      return isPowerballMatched ? 4 : 0; // Match 1 + Powerball
    case 0:
      isPowerballMatched ? winCounts.powerballOnly++ : 0;
      return isPowerballMatched ? 4 : 0; // Match only Powerball
    default:
      return 0; // No matches
  }
};

const PowerballSimulator: React.FC = () => {
  const [userTicket, setUserTicket] = useState<PowerballTicket>({
    numbers: [1, 2, 3, 4, 5],
    powerball: 6,
  });
  const [winningTicket, setWinningTicket] = useState<PowerballTicket | null>(
    null
  );
  const [moneySpent, setMoneySpent] = useState(0);
  const [moneyWon, setMoneyWon] = useState(0);
  const [isValidTicket, setIsValidTicket] = useState(true);
  const [ticketHistory, setTicketHistory] = useState<PowerballTicket[]>([]);

  const [ticketsMultiplier, setTicketsMultiplier] = useState<number>(1);

  const [isAutoBuyActive, setIsAutoBuyActive] = useState(false);
  const [autoBuyDuration, setAutoBuyDuration] = useState<number>(3000); // duration in milliseconds
  const [showGraph, setShowGraph] = useState(false);

  useEffect(() => {
    let autoBuyInterval: NodeJS.Timer;

    if (isAutoBuyActive) {
      autoBuyInterval = setInterval(() => {
        buyTicket();
      }, autoBuyDuration);
    }

    return () => {
      if (autoBuyInterval) {
        clearInterval(autoBuyInterval as unknown as number);
      }
    };
  }, [isAutoBuyActive, autoBuyDuration, ticketsMultiplier]);

  const ticketHistoryRef = useRef<HTMLDivElement>(null);

  const handleTicketsMultiplierChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = Number(e.target.value);
    setTicketsMultiplier(value > 99999 ? 99999 : value);
  };

  useEffect(() => {
    if (ticketHistoryRef.current) {
      ticketHistoryRef.current.scrollTop =
        ticketHistoryRef.current.scrollHeight;
    }
  }, [ticketHistory]);

  const initialWinCounts: WinCounts = {
    jackpot: 0,
    match5: 0,
    match4Powerball: 0,
    match4: 0,
    match3Powerball: 0,
    match3: 0,
    match2Powerball: 0,
    match1Powerball: 0,
    powerballOnly: 0,
  };

  const [winCounts, setWinCounts] = useState<WinCounts>(initialWinCounts);

  const [totalTickets, setTotalTickets] = useState(0);

  const handleNumberChange = (index: number, value: number) => {
    const newNumbers = [...userTicket.numbers];
    newNumbers[index] = value;
    setUserTicket({ ...userTicket, numbers: newNumbers });
  };

  const handlePowerballChange = (value: number) => {
    setUserTicket({ ...userTicket, powerball: value });
  };

  interface Entry {
    year: number;
    "Total Winnings": number;
  }

  // State to keep track of winnings history
  const [winningsHistory, setWinningsHistory] = useState<Entry[]>([]);

  const calculateYears = (numTickets: number) => {
    const years = Math.floor(totalTickets / (52 * 2));
    return years;
  };

  const moneyWonRef = useRef(moneyWon);
  useEffect(() => {
    moneyWonRef.current = moneyWon;
  }, [moneyWon]);

  const totalTicketsRef = useRef(totalTickets);

  useEffect(() => {
    if (!showGraph) {
      return;
    }
    // Set an interval to update the winnings history every 3 seconds
    const interval = setInterval(() => {
      setWinningsHistory((prevHistory) => {
        // Add the current money won from the ref and keep only the last 100 data points
        const newEntry: Entry = {
          year: calculateYears(totalTicketsRef.current),
          "Total Winnings": moneyWonRef.current,
        };
        const updatedHistory = [...prevHistory, newEntry];
        return updatedHistory.slice(-MAX_HISTORY_SIZE);
      });
    }, 1000); // Update time in ms

    // Clear the interval when the component unmounts
    return () => clearInterval(interval);
  }, [showGraph]); // Empty dependency array

  // const transformedChartData = winningsHistory.map((winnings, index) => ({
  //   year: index, // Assuming time starts at 1
  //   "Total Winnings": winnings,
  // }));

  const validateTicket = (ticket: PowerballTicket): boolean => {
    if (ticket.numbers.length !== 5) {
      return false;
    }

    for (const number of ticket.numbers) {
      if (number < 1 || number > 69) {
        return false;
      }
    }

    const uniqueNumbers = new Set(ticket.numbers);
    if (uniqueNumbers.size !== ticket.numbers.length) {
      return false;
    }

    if (ticket.powerball < 1 || ticket.powerball > 26) {
      return false;
    }

    return true;
  };

  const buyTicket = () => {
    let isValid = false;
    let totalMoneySpent = 0;
    let totalMoneyWon = 0;
    let newWinningTicket;
    let ticketHistory: PowerballTicket[] = [];

    if (validateTicket(userTicket)) {
      for (let i = 0; i < ticketsMultiplier; i++) {
        isValid = true;
        totalMoneySpent += 2;
        newWinningTicket = generateRandomTicket();
        const winnings = calculateWinnings(
          userTicket,
          newWinningTicket,
          winCounts
        );
        totalMoneyWon += winnings;
        ticketHistory.push(newWinningTicket);
      }
    } else {
      isValid = false;
    }

    setIsValidTicket(isValid);

    if (isValid) {
      setMoneySpent((prev) => prev + totalMoneySpent);
      setWinningTicket(newWinningTicket || null);
      setMoneyWon((prev) => prev + totalMoneyWon);
      setWinCounts({ ...winCounts });

      setTicketHistory((prevHistory) => {
        const updatedHistory = [...prevHistory, ...ticketHistory];
        return updatedHistory.slice(-MAX_HISTORY_SIZE);
      });

      setTotalTickets((prevTotal) => prevTotal + ticketsMultiplier);
    }
  };

  // Function to calculate net gain/loss
  const calculateNetGain = () => {
    return moneyWon - moneySpent;
  };

  const calculateWinningsPercent = () => {
    let percent = (moneyWon / moneySpent) * 100;
    if (isNaN(percent)) {
      return "0.00";
    }
    return percent.toFixed(2);
  };

  // Function to get color based on value
  const getColor = (value: number, type: "text" | "bg") => {
    const color = value > 0 ? "green" : value < 0 ? "red" : "gray";
    return type === "bg" ? `bg-${color}-500` : `text-${color}-500`;
  };

  // Function to get background color based on value
  const getBackgroundColor = (value: number) => {
    if (value > 0) return "bg-green-200";
    if (value < 0) return "bg-red-200";
    return "bg-gray-200";
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Powerball Simulator
      </h1>

      <TicketInput
        ticket={userTicket}
        onNumberChange={handleNumberChange}
        onPowerballChange={handlePowerballChange}
      />

      <button
        className="w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600 my-4"
        onClick={buyTicket}
      >
        Buy Ticket
      </button>

      <div className="flex flex-wrap justify-center items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label htmlFor="auto-buy-toggle" className="font-semibold">
            Auto Buy Tickets:
          </label>
          <input
            className="w-6 h-6"
            id="auto-buy-toggle"
            type="checkbox"
            checked={isAutoBuyActive}
            onChange={(e) => setIsAutoBuyActive(e.target.checked)}
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="auto-buy-duration" className="font-semibold">
            Duration (ms):
          </label>
          <input
            id="auto-buy-duration"
            type="number"
            value={autoBuyDuration}
            onChange={(e) => setAutoBuyDuration(Number(e.target.value))}
            min="1"
            className="w-20 p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="tickets-multiplier" className="font-semibold">
            Tickets per Buy:
          </label>
          <input
            id="tickets-multiplier"
            type="number"
            value={ticketsMultiplier}
            onChange={(e) => handleTicketsMultiplierChange(e)}
            min="1"
            className="w-28 p-2 border border-gray-300 rounded"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="font-semibold">Show Graph:</label>
          <input
            className="w-6 h-6"
            id="auto-buy-toggle"
            type="checkbox"
            checked={showGraph}
            onChange={(e) => setShowGraph(e.target.checked)}
          />
        </div>
      </div>

      <ValidationMessage isValid={isValidTicket} />

      <div className="flex flex-wrap justify-between my-4">
        <div className="w-full md:w-1/2 p-2">
          <StatisticsDisplay
            moneySpent={moneySpent}
            moneyWon={moneyWon}
            netGain={calculateNetGain()}
            getBackgroundColor={getBackgroundColor}
            years={calculateYears(totalTickets)}
            winningsPercent={calculateWinningsPercent()}
          />
          {userTicket && (
            <TicketDisplay label="Your Ticket" ticket={userTicket} />
          )}
          {/* {winningTicket && (
            <TicketDisplay label="Last Winning Ticket" ticket={winningTicket} />
          )} */}
          <TicketHistory
            historyRef={ticketHistoryRef}
            ticketHistory={ticketHistory}
            totalTickets={totalTickets}
          />
        </div>

        <div className="w-full md:w-1/2 p-2">
          <WinsDisplay winCounts={winCounts} />
        </div>
      </div>

      {showGraph && <WinningsLineChart chartData={winningsHistory} />}
    </div>
  );
};

export default PowerballSimulator;

const TicketInput = ({
  ticket,
  onNumberChange,
  onPowerballChange,
}: TicketInputProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-4">
      {ticket.numbers.map((number, index) => (
        <input
          key={index}
          type="number"
          value={number}
          className="w-14 p-2 border border-gray-300 rounded"
          onChange={(e) => onNumberChange(index, parseInt(e.target.value))}
          min="1"
          max="69"
        />
      ))}
      <input
        type="number"
        value={ticket.powerball}
        className="w-14 p-2 border border-gray-300 rounded bg-red-100"
        onChange={(e) => onPowerballChange(parseInt(e.target.value))}
        min="1"
        max="26"
      />
    </div>
  );
};

const StatisticsDisplay = ({
  moneySpent,
  moneyWon,
  netGain,
  getBackgroundColor,
  years,
  winningsPercent,
}: StatisticsDisplayProps) => {
  // Function to format numbers with commas
  const formatNumber = (num: number | string) => {
    const numNum = Number(num);
    if (isNaN(numNum)) {
      return num;
    }
    return numNum.toLocaleString();
  };
  return (
    <div className="text-center mt-4">
      {/* Set a fixed width for the number display sections */}
      <style>{`
        .number-display {
          min-width: 150px; /* Adjust this value as needed */
          text-align: right;
        }
      `}</style>

      <div
        className={`flex justify-between items-center mb-2 rounded-lg ${getBackgroundColor(
          -moneySpent
        )}`}
      >
        <div className="mr-2 px-3 py-1">Money Spent:</div>
        <div className="font-semibold text-black px-3 py-1 number-display">
          ${formatNumber(moneySpent)}
        </div>
      </div>
      <div
        className={`flex justify-between items-center mb-2 rounded-lg ${getBackgroundColor(
          moneyWon
        )}`}
      >
        <div className="mr-2 px-3 py-1">Money Won:</div>
        <div className="font-semibold text-black px-3 py-1 number-display">
          ${formatNumber(moneyWon)}
        </div>
      </div>
      <div
        className={`flex justify-between items-center mb-2 rounded-lg ${getBackgroundColor(
          netGain
        )}`}
      >
        <div className="mr-2 px-3 py-1">Net Gain/Loss:</div>
        <div className="font-semibold text-black px-3 py-1 number-display">
          ${formatNumber(netGain)}
        </div>
      </div>
      <div
        className={`flex justify-between items-center mb-2 rounded-lg ${getBackgroundColor(
          0
        )}`}
      >
        <div className="mr-2 px-3 py-1">Years (2 tickets per week):</div>
        <div className="font-semibold text-black px-3 py-1 number-display">
          {formatNumber(years)}
        </div>
      </div>
      <div
        className={`flex justify-between items-center mb-2 rounded-lg ${getBackgroundColor(
          0
        )}`}
      >
        <div className="mr-2 px-3 py-1">Winnings:</div>
        <div className="font-semibold text-black px-3 py-1 number-display">
          {winningsPercent}%
        </div>
      </div>
    </div>
  );
};

const TicketHistory = ({
  historyRef,
  ticketHistory,
  totalTickets,
}: TicketHistoryProps) => {
  const startIndex = totalTickets - ticketHistory.length;

  return (
    <div className="mt-4 bg-gray-100 p-4 rounded">
      <p className="font-semibold mb-2">Ticket History:</p>

      <div ref={historyRef} className="overflow-y-auto h-28 text-sm">
        {ticketHistory.map((ticket, index) => (
          <div key={index} className="mt-1">
            <p>
              #{startIndex + index + 1}:{" "}
              <b>
                {" ["}
                {ticket.numbers.join(", ")}
                {"]"}
              </b>{" "}
              PB: <b>{ticket.powerball}</b>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ValidationMessage = ({ isValid }: ValidationMessageProps) => {
  if (!isValid) {
    return <p className="text-red-500">Please enter a valid ticket.</p>;
  }
  return null;
};

const TicketDisplay = ({ label, ticket }: TicketDisplayProps) => {
  return (
    <div className="mt-4 bg-gray-100 p-4 rounded">
      <p className="font-semibold">{label}:</p>
      <p>Numbers: {ticket.numbers.join(", ")}</p>
      <p>Powerball: {ticket.powerball}</p>
    </div>
  );
};

interface TicketInputProps {
  ticket: PowerballTicket;
  onNumberChange: (index: number, value: number) => void;
  onPowerballChange: (value: number) => void;
}

interface StatisticsDisplayProps {
  moneySpent: number;
  moneyWon: number;
  netGain: number;
  getBackgroundColor: (value: number) => string;
  years: number;
  winningsPercent: string;
}

interface TicketHistoryProps {
  historyRef: React.RefObject<HTMLDivElement>;
  ticketHistory: PowerballTicket[];
  totalTickets: number;
}

interface ValidationMessageProps {
  isValid: boolean;
}

interface TicketDisplayProps {
  label: string;
  ticket: PowerballTicket;
}

interface WinCounts {
  jackpot: number;
  match5: number;
  match4Powerball: number;
  match4: number;
  match3Powerball: number;
  match3: number;
  match2Powerball: number;
  match1Powerball: number;
  powerballOnly: number;
}

const WinsDisplay: React.FC<{ winCounts: WinCounts }> = ({ winCounts }) => {
  return (
    <div className="mt-4 p-4 bg-white rounded-lg">
      <h3 className="text-lg font-bold text-center text-black mb-4">
        Win Counts:
      </h3>
      <div className="flex flex-col gap-2">
        <div className="bg-blue-100 p-2 rounded-md">
          <span className="font-semibold">Jackpot (250M):</span>{" "}
          {winCounts.jackpot}
        </div>
        <div className="bg-green-100 p-2 rounded-md">
          <span className="font-semibold">5 Numbers:</span> {winCounts.match5}
        </div>
        <div className="bg-purple-100 p-2 rounded-md">
          <span className="font-semibold">4 Numbers + Powerball:</span>{" "}
          {winCounts.match4Powerball}
        </div>
        <div className="bg-pink-100 p-2 rounded-md">
          <span className="font-semibold">4 Numbers:</span> {winCounts.match4}
        </div>
        <div className="bg-red-100 p-2 rounded-md">
          <span className="font-semibold">3 Numbers + Powerball:</span>{" "}
          {winCounts.match3Powerball}
        </div>
        <div className="bg-orange-100 p-2 rounded-md">
          <span className="font-semibold">3 Numbers:</span> {winCounts.match3}
        </div>
        <div className="bg-yellow-100 p-2 rounded-md">
          <span className="font-semibold">2 Numbers + Powerball:</span>{" "}
          {winCounts.match2Powerball}
        </div>
        <div className="bg-teal-100 p-2 rounded-md">
          <span className="font-semibold">1 Number + Powerball:</span>{" "}
          {winCounts.match1Powerball}
        </div>
        <div className="bg-indigo-100 p-2 rounded-md">
          <span className="font-semibold">Only Powerball:</span>{" "}
          {winCounts.powerballOnly}
        </div>
      </div>
    </div>
  );
};

const WinningsLineChart = ({ chartData }: { chartData: any }) => {
  const valueFormatter = (number: number) => {
    const formatter = new Intl.NumberFormat("us", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

    let formattedNumber;

    if (number >= 1e9) {
      formattedNumber = `${formatter.format(number / 1e9)}B`;
    } else if (number >= 1e6) {
      formattedNumber = `${formatter.format(number / 1e6)}M`;
    } else if (number >= 1e3) {
      formattedNumber = `${formatter.format(number / 1e3)}K`;
    } else {
      formattedNumber = `${formatter.format(number)}`;
    }

    return formattedNumber;
  };

  // const mockData = [
  //   { time: 1, "Total Winnings": 100 },
  //   { time: 2, "Total Winnings": 200 },
  //   { time: 3, "Total Winnings": 300 },
  // ];

  return (
    <div>
      <Card>
        <Title>Winnings Over Time</Title>
        <AreaChart
          className="mt-6"
          data={chartData}
          index="year"
          categories={["Total Winnings"]}
          colors={["blue"]}
          valueFormatter={valueFormatter}
          // yAxisValueFormatter={valueFormatter} // Add this to format Y axis values
          // hideXAxisLabels={true} // Add this to hide X axis labels
          yAxisWidth={40}
        />
      </Card>
    </div>
  );
};
