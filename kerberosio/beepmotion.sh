#! /bin/bash
gpiopin=$1
tone () {
  local note="$1"
  local sleep=$2
  if test "$note" -eq 0; then
    gpio -g mode $gpiopin in
  else
    local period="$(perl -e"printf'%.0f',600000/440/2**(( $note-69)/12 )")"
    gpio -g mode $gpiopin pwm
    gpio pwmr "$(( period ))"
    gpio -g pwm $gpiopin "$(( period/2 ))"
    gpio pwm-ms
  fi
  if [ $(bc <<< "$sleep != 0") -eq 1 ]; then
    sleep $sleep
    tone 0 0
  fi
}

tone 70 0.1
tone 75 0.1

