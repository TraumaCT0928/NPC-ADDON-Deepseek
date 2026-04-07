
tag @s add riding
scoreboard objectives add navodchik_bmp2d dummy
scoreboard players set @s[tag=mehvod] navodchik_bmp2d 0
execute @e[type=addon:bmp2dtunk,r=4] ~~2 ~-0.7 tag @a[r=2.5,rm=0.5] add navodchik
execute @e[type=addon:bmp2dtunk,r=4] ~~2 ~-0.7 tag @a[tag=riding,r=5,rm=2.5] remove navodchik
execute @e[type=addon:bmp2dtunk,r=4] ~ ~ ~ effect @a[r=2] resistance 1 220 true
execute @s[tag=navodchik] ~~~ playanimation @e[type=addon:bmp2dtunk,r=3,c=1] animation.bashnya
title @s[tag=navodchik] title hud.bmp2d_scope