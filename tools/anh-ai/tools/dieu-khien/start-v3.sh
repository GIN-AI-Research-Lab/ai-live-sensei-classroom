#!/bin/bash
# thu bat VM spot, toi da 13 lan x ~2.5 phut (~30 phut)
LOG="$1"
for i in $(seq 1 13); do
  echo "== thu lan $i $(date '+%F %T')" >> "$LOG"
  gcloud compute instances start a100-benchmark-runner --zone us-central1-a >> "$LOG" 2>&1
  st=$(gcloud compute instances describe a100-benchmark-runner --zone us-central1-a --format='value(status)' 2>>"$LOG")
  echo "status=$st" >> "$LOG"
  if [ "$st" = "RUNNING" ]; then echo "BAT_DUOC $(date '+%F %T')" >> "$LOG"; exit 0; fi
  [ $i -lt 13 ] && sleep 150
done
echo "BO_CUOC $(date '+%F %T')" >> "$LOG"; exit 1
