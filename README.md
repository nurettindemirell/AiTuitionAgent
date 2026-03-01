## Live Links

* **Youtube Presentation Video:** [https://www.youtube.com/watch?v=JEolW9EkkZU]
* **GitHub Repository:** [https://github.com/nurettindemirell/AiTuitionAgent](https://github.com/nurettindemirell/AiTuitionAgent)
* **Azure Website:** [https://ai-tuition-agent-backend-hvguhnc6aqbnbvdb.polandcentral-01.azurewebsites.net](https://ai-tuition-agent-backend-hvguhnc6aqbnbvdb.polandcentral-01.azurewebsites.net)



# AI Tuition Agent

AI Tuition Agent is a chat-based application developed for the **SE4458 course assignment**. It allows students to perform tuition-related actions by simply chatting with the system in natural language, instead of calling APIs or navigating forms.

The project builds on the Midterm APIs and adds an **AI-powered conversational layer** using an API Gateway architecture.

---

## Features

Students can interact with the system using natural language to:

* Check their tuition fees
* Pay tuition fees
* View unpaid tuition fees

Example messages:

* "check my tuition"
* "pay tuition for fall 2026 15000"
* "show unpaid tuition for spring 2026"

---

## System Overview

The system provides a conversational interface where users express what they want in free text. The AI agent understands the request, extracts required information, and triggers the correct backend API.

Instead of manually calling REST endpoints, users only chat with the system.

---

## Architecture

The project follows the **API Gateway Pattern** and consists of two main components.

### Frontend (React)

* Chat-based user interface
* Sends user messages to the backend gateway
* Displays responses from the AI agent
* Does **not** communicate directly with Midterm APIs

### Backend (Node.js / Express)

* Acts as a central API Gateway
* Receives messages from the frontend
* Uses **OpenAI (gpt-4o-mini)** to:

  * Detect user intent
  * Extract required parameters
* Calls the appropriate Midterm API
* Sends structured responses back to the frontend

---

## AI Agent Logic

The AI agent performs two main tasks:

### 1. Intent Detection

The agent maps user messages to one of the following intents:

* `QUERY_TUITION`
* `PAY_TUITION`
* `UNPAID_TUITION`

### 2. Parameter Extraction

From free-text input, the agent extracts:

* `studentNo`
* `term` (FALL / SPRING / SUMMER)
* `amount` (for payments)

If any required information is missing, the system continues the conversation and asks the user for the missing data.

---

## API Flow

```
User
 → React Chat UI
 → Node.js API Gateway
 → OpenAI (intent + parameter extraction)
 → Midterm APIs
 → API Gateway
 → React Chat UI
```

All requests **must pass through the gateway**.

---

## APIs Used

All APIs are accessed via the gateway:

* **Tuition Inquiry**
  `GET /api/v1/banking/tuition`

* **Tuition Payment**
  `POST /api/v1/banking/pay`

* **Unpaid Tuition List**
  `GET /api/v1/admin/tuition/unpaid`

---

## Assumptions

* Authentication uses a fixed username and password
* Student numbers are numeric
* Academic terms follow one of these formats:

  * `FALL-YYYY`
  * `SPRING-YYYY`
  * `SUMMER-YYYY`

---

## Challenges

During development, the following challenges were encountered:

* Handling multi-step conversations when user input is incomplete
* Differentiating between year values and payment amounts in messages
* Synchronizing frontend and backend in a chat-based flow
* Enforcing strict gateway usage for all API calls
* Managing token limits and AI usage costs

---

## Running the Project Locally

### Backend

```
cd backend
npm install
node index.js
```

Runs on: `http://localhost:3001`

### Frontend

```
cd frontend
npm install
npm start
```

The frontend communicates with the backend via the `/gateway` endpoint.

---

## Conclusion

This project demonstrates how traditional REST APIs can be transformed into a conversational system using an AI agent. By combining LLM-based intent detection with an API Gateway architecture, the SE4458 assignment requirements are met while providing a simpler and more natural user experience.
