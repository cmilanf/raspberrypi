#!/bin/bash
GPIO_PIN=13
FILENAME="axelf.ton"

banner() {
  echo "Raspberry Pi PC Speaker GPIO player"
	echo "by Carlos Milán Figueredo. https://www.hispamsx.org"
	echo ""
}

helpmsg() {
	echo "Usage: ./playtone.sh --gpio-pin <BCM_GPIO> --filename <filename.ton>"
	echo ""
}

chkbin() {
    if ! [ -x "$(command -v $1)" ]; then
        echo "ERROR: This script requires $1 program to continue. Please install it."
        exit 1
    fi
}

checkdeps() {
    chkbin perl
    chkbin bc
    chkbin gpio
}

tone() {
  local freq="$1"
  local dur=$2
  if test "$freq" -eq 0; then
    gpio -g mode $GPIO_PIN in
  else
    # If we are passing frequencies directly, the period is the inverse
    local period="$(perl -e "printf '%.0f', 1000000/$freq")" 
    gpio -g mode $GPIO_PIN pwm
    gpio pwmr "$(( period ))"

    gpio -g pwm $GPIO_PIN "$(( period/2 ))"
    gpio pwm-ms
  fi
  if [ $(bc <<< "$dur != 0") -eq 1 ]; then
    sleep $dur
    tone 0 0
  fi
}

banner
checkdeps

while [ $# -gt 0 ]
do
  case "$1" in
    --gpio-pin)
      GPIO_PIN="$2"
      shift 2
      ;;
    --filename)
      FILENAME="$2"
      shift 2
      ;;
    *)
      helpmsg
      echo "Invalid argument or syntax fail: $1"; echo ''
      exit 1
      ;;
  esac
done

while read -r freq dur
do
  echo "$freq $dur"
	if [[ $freq =~ ^[0-9]+$ ]]; then
		tone $freq $(echo "scale=3; $dur / 1000" | bc)
	else
		if [ "$freq" == "r" ]; then
			sleep $(echo "scale=3; $dur / 1000" | bc )
		fi
	fi
done < "$FILENAME"
