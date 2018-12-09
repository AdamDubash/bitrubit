#!/bin/bash

#remove log files
rm ./err.txt && rm ./out.txt

#remove current running process
forever stopall && killall node

#restart
npm run daemon

echo "Successful restart!"