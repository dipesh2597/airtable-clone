#!/bin/bash
cd backend
uvicorn main:socket_app --host 0.0.0.0 --port $PORT 