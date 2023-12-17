#! /bin/bash
########################################################
#      Big Ben clock sound for Raspberry Pi GPIO       #
#              Carlos Milán Figueredo                  #
########################################################
# This script uses a PC Spekaer connected to the Pi    #
# GPIO in order to play the typical Big Ben sound.     #
#                                                      #
# It is based in the experiment of Dale Mitchell you   #
# can find here:                                       #
# https://github.com/DaleMitchell/pcspkr_keyboard      #
########################################################

export d0=43
export r0=45
export m0=47
export f0=48
export s0=50
export l0=52
export si0=53
export d1=55
export r1=57
export m1=59
export f1=60
export s1=62
export l1=64
export si1=65
export d2=67
export r2=69
export m2=71

if [ -z $1 ]; then
	echo "BigBen sound script for Raspberry Pi PC Speaker GPIO"
	echo "by Carlos Milán Figueredo. http://www.hispamsx.org"
	echo ""
	echo "Usage: ./bigbensound.sh <BCM_GPIO> [quarter | half | halfquarter | hour]"
	echo ""
	echo "If you don't input second parameter, then sound will be played depending on current time."
fi

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

play_hour  () {
	local hour=$(date +"%l")
	tone $m1 0.5
	tone $d1 0.5
	tone $r1 0.5
	tone $m0 1
	sleep 1
	tone $m0 0.5
	tone $r1 0.5
	tone $m1 0.5
	tone $d1 1
	sleep 1
	tone $m1 0.5
	tone $r1 0.5
	tone $d1 0.5
	tone $m0 1
	sleep 1
	tone $m0 0.5
	tone $r1 0.5
	tone $m1 0.5
	tone $d1 1
	sleep 2
	
	for i in `seq 1 $hour`
	do
		tone $d1 1
		sleep 1
	done
}

play_quarter () {
        tone $m1 0.5
        tone $d1 0.5
        tone $r1 0.5
        tone $m0 1
}

play_half () {
        tone $m1 0.5
        tone $d1 0.5
        tone $r1 0.5
        tone $m0 1
        sleep 1
        tone $m0 0.5
        tone $r1 0.5
        tone $m1 0.5
        tone $d1 1
}

play_halfquarter () {
        tone $m1 0.5
        tone $d1 0.5
        tone $r1 0.5
        tone $m0 1
        sleep 1
        tone $m0 0.5
        tone $r1 0.5
        tone $m1 0.5
        tone $d1 1
        sleep 1
        tone $m1 0.5
        tone $r1 0.5
        tone $d1 0.5
        tone $m0 1
}

case "$2" in
	hour)
		play_hour
		;;
	quarter)
		play_quarter
		;;
	half)
		play_half
		;;
	halfquarter)
		play_halfquarter
		;;
	*)
		minute=$(date +"%M")
		case $minute in
			15)
				play_quarter
				;;
			30)
				play_half
				;;
			45)
				play_halfquarter
				;;
			00)
				play_hour
				;;
		esac
		;;
esac

