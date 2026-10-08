#!/bin/bash
# phien-v3d.sh - chay phien cuoi: day script, chay, tai base28 + base20-v3b ve, roi TAT VM (ke ca khi loi)
# S = thu muc lam viec cuc bo (arg 1; can co $S/probe); KHO = tools/anh-ai
S="${1:-${ANH_AI_WORK:-$HOME/anh-ai-work}}"; KHO=$(cd "$(dirname "$0")/../.." && pwd); Z="--zone us-central1-a"; V=a100-benchmark-runner; H=${VM_HOME:-.}
mkdir -p "$S/probe"
ssh_() { gcloud compute ssh $V $Z --strict-host-key-checking=no --command "$1" < /dev/null 2>/dev/null; }
tat() { echo "$(date '+%T') dung VM"; gcloud compute instances stop $V $Z < /dev/null 2>&1 | tail -1; gcloud compute instances list --format="table(name,status)" 2>&1; }
trap tat EXIT
for i in 1 2 3 4 5; do gcloud compute scp --strict-host-key-checking=no "$KHO/vm/chay-v3c.sh" $V:$H/ $Z < /dev/null > /dev/null 2>&1 && break; sleep 10; done
ssh_ "chmod +x ~/chay-v3c.sh; nohup ~/chay-v3c.sh > ~/chay-v3c.out 2>&1 < /dev/null & sleep 1; cat ~/chay-v3c.out"
echo "$(date '+%T') da chay"; T0=$(date +%s)
xong28=0
for i in $(seq 1 60); do
  st=$(gcloud compute instances describe $V $Z --format='value(status)' 2>/dev/null)
  [ "$st" != "RUNNING" ] && { echo "$(date '+%T') VM $st"; break; }
  r=$(ssh_ "grep -c TAT_CA_XONG ~/anh/run-v3.log; grep -c TAT_CA_XONG ~/anh/run-v3b.log 2>/dev/null || echo 0; grep -E 'seed=' ~/anh/run-v3b.log ~/anh/run-v3.log | tail -1")
  echo "$(date '+%T') $(echo $r | tr '\n' ' ')"
  a=$(echo "$r" | sed -n 1p); b=$(echo "$r" | sed -n 2p)
  if [ "$a" -ge 1 ] 2>/dev/null && [ $xong28 = 0 ]; then
    (cd "$S/probe" && gcloud compute scp --strict-host-key-checking=no --recurse $V:$H/anh/probe/base28 . $Z < /dev/null > /dev/null 2>&1) && { xong28=1; echo "$(date '+%T') tai base28 xong"; }
  fi
  het=0; [ $(( $(date +%s) - T0 )) -gt 600 ] && { het=1; echo "$(date '+%T') gan het tran thoi gian -> tai phan da co"; }
  if [ "$b" -ge 1 ] 2>/dev/null || [ $het = 1 ]; then
    (cd "$S/probe" && gcloud compute scp --strict-host-key-checking=no --recurse $V:$H/anh/probe/base20-v3b . $Z < /dev/null > /dev/null 2>&1) && echo "$(date '+%T') tai base20-v3b xong"
    [ $xong28 = 0 ] && (cd "$S/probe" && gcloud compute scp --strict-host-key-checking=no --recurse $V:$H/anh/probe/base28 . $Z < /dev/null > /dev/null 2>&1)
    ssh_ "cat ~/anh/run-v3.log | grep -E 'xong|dua trans'; grep -E 'xong|dua trans' ~/anh/run-v3b.log" > "$S/probe/log-v3d.txt"
    break
  fi
  sleep 20
done
