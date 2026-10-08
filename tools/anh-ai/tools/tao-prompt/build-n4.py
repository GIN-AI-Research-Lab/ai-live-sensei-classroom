# -*- coding: utf-8 -*-
# Tao prompt-n4.json tu bang tay ben duoi + du lieu giao trinh N4
# Dinh dang bang:  id|ten|loai|kho|prompt   (prompt rong = dung lai anh cua ten da khai bao truoc)
#                  id|-|ly do bo qua        (giu SVG)
#                  them "|neg:..." o cuoi de bo sung negative rieng
import json, os, sys

# ---- PATHS (sua o day neu doi cho dat) ----
# REPO = goc repo ai-live-sensei-classroom (mac dinh: 4 cap tren tools/anh-ai/tools/tao-prompt/; doi bang SENSEI_REPO)
# RA   = noi ghi tep prompt moi tao (mac dinh: $ANH_AI_WORK/goc, KHONG ghi de len prompts/ da luu tru)
import os as _os
_QH = _os.path.dirname(_os.path.abspath(__file__))
REPO = _os.environ.get('SENSEI_REPO') or _os.path.abspath(_os.path.join(_QH, '..', '..', '..', '..'))
WORK = _os.environ.get('ANH_AI_WORK') or _os.path.join(_os.path.expanduser('~'), 'anh-ai-work')
RA_DIR = _os.path.join(WORK, 'goc'); _os.makedirs(RA_DIR, exist_ok=True)
# ---- het PATHS ----
GOC = os.path.join(REPO, "curriculum")
RA = RA_DIR

STYLE = ("flat minimal vector illustration, soft rounded shapes, warm muted palette of terracotta orange-red, "
         "sage green, muted mustard gold and warm cream, thin dark charcoal-ink outlines, gentle two-to-three tone "
         "flat shading, people drawn as simple friendly rounded cartoon figures with dot eyes and rosy cheeks, "
         "single clear subject centered on a plain light warm paper-beige background, generous empty margin, "
         "no text, no letters, no numbers, no writing of any kind, no watermark, square 1:1 composition")

NEG = ("text, letters, words, numbers, digits, kanji, hiragana, katakana, captions, labels, readable signage, "
       "speech bubble text, watermark, signature, logo, brand name, photorealistic, photograph, 3d render, "
       "glossy plastic, harsh shadows, busy detailed background, cluttered, split screen, collage, frame border, "
       "blurry, low quality, jpeg artifacts, deformed hands, extra fingers, extra limbs, distorted face, gore, "
       "neon colors, oversaturated, dark gloomy palette")

BANG = r"""
voc-n4-26-1|oversleep|nhanvat|2|A young person jolting awake in a messy bed with wide panicked eyes, hair sticking up, grabbing an alarm clock with a blank face while bright late-morning sunlight pours through the window
voc-n4-26-2|be-late|nhanvat|2|A flustered office worker in a suit sprinting along a station platform with a swinging briefcase and flying sweat drops as the train doors close and the train pulls away without them
voc-n4-26-3|broken|vocab|1|A ceramic vase lying cracked and broken into several jagged pieces on a wooden floor, small shards scattered around it
voc-n4-26-4|get-well|nhanvat|3|A smiling person sitting up in bed and stretching both arms happily, pushing aside a thermometer and a medicine bottle, bright sunshine at the window, clearly recovered after being sick
voc-n4-26-5|accident|canh|2|Two small cars that have crashed into each other at an intersection with crumpled front bumpers, a puff of smoke and a red warning triangle placed on the road
voc-n4-26-6|-|Danh tu truu tuong (ly do) - khong co hinh cu the day dung nghia
voc-n4-26-7|-|Tinh trang chung (suc khoe/may moc) - nghia qua rong, mot hinh khong day dung
voc-n4-26-8|fever|nhanvat|1|A person lying in bed with a flushed red face, a thermometer in the mouth, a folded damp towel on the forehead and wavy heat lines rising from the head
voc-n4-26-9|meeting|canh|2|Several office workers seated around a long table in a meeting, one presenting a simple bar chart on a whiteboard while the others listen and take notes
voc-n4-26-10|meeting-room|canh|2|An empty modern meeting room with a long table, neatly arranged chairs, a blank whiteboard and a projector screen, seen from the open doorway
voc-n4-26-11|train|vocab|1|A Japanese commuter electric train with a colored stripe along its side gliding on an elevated track, pantograph on the roof
voc-n4-26-12|work-job|nhanvat|2|An office worker concentrating at a desk, typing on a laptop beside stacks of documents and a coffee mug
voc-n4-26-13|hospital|canh|1|A clean white hospital building with many windows and a simple cross emblem on its facade, an ambulance parked at the entrance
voc-n4-26-14|cold-flu|nhanvat|1|A person wrapped in a thick scarf wearing a white face mask, sneezing into a tissue with a red runny nose, a box of tissues beside them
voc-n4-26-15|-|Trang tu tan suat (thuong thi) - truu tuong, khong ve duoc
voc-n4-26-16|-|Trang tu the hien thai do (qua nhien) - khong co hinh
voc-n4-26-17|-|Trang tu (cuoi cung thi) - truu tuong, khong co hinh
voc-n4-26-18|opinion|canh|3|In a meeting, one person raises a hand and speaks up earnestly with an open gesturing palm while colleagues around the table turn to listen attentively
voc-n4-26-19|-|Trang tu muc do (chac chan, ky cang) - nghia sac thai, hinh de hieu sai
voc-n4-26-20|its-okay|nhanvat|2|A child who has tripped on the sidewalk sitting up, smiling and giving a cheerful OK hand sign to a worried friend who reaches out to help
voc-n4-27-1|can-speak|nhanvat|3|A young person chatting fluently and confidently with a smiling foreign traveler, both gesturing naturally with empty rounded speech bubbles, the traveler nodding in understanding
voc-n4-27-2|can-write|nhanvat|3|A proud child holding up a notebook page filled with neat wavy pencil lines and a gold star sticker, a pencil in the other hand, a parent clapping beside them
voc-n4-27-3|can-swim|nhanvat|2|A child confidently swimming freestyle across a pool without any float ring while a coach at the poolside gives a big thumbs up
voc-n4-27-4|-|The kha nang cua 飲みます - hinh trung voi dong tu goc, khong the hien duoc 'duoc/co the'
voc-n4-27-5|-|The kha nang cua 食べます - hinh trung voi dong tu goc, khong the hien duoc 'duoc/co the'
voc-n4-27-6|can-see-view|canh|3|A person at a wide window happily pointing at a clear view of snowcapped Mount Fuji visible in the distance beyond the rooftops
voc-n4-27-7|-|The kha nang cua 来ます - 'den duoc' khong phan biet duoc bang hinh voi 来ます
voc-n4-27-8|can-do|nhanvat|3|A child raising both arms in triumph after finally riding a bicycle without training wheels for the first time
voc-n4-27-9|drive|nhanvat|1|A person driving a small car with both hands on the steering wheel, seen through the side window on a quiet road
voc-n4-27-10|conversation|nhanvat|2|Two friends sitting at a cafe table talking and laughing, empty rounded speech bubbles floating between them
voc-n4-27-11|swimming|canh|2|A swimmer in a cap and goggles doing freestyle in an indoor lane pool with lane ropes and splashing water
voc-n4-27-12|exercise|nhanvat|1|A person in a tracksuit doing energetic jumping jacks in a park with small motion lines around the arms and legs
voc-n4-27-13|piano|vocab|1|An upright piano with the lid open showing black and white keys, a small round stool in front
voc-n4-27-14|driver-job|nhanvat|2|A professional Japanese taxi driver in a uniform cap and white gloves sitting at the wheel of a taxi, smiling
voc-n4-27-15|university-student|nhanvat|1|A young university student with a backpack and textbooks under the arm walking across a campus lawn in front of a university building
voc-n4-27-16|enter-school|canh|2|A first-grade child wearing a large randoseru school backpack standing proudly at a school gate under blooming cherry trees, parents smiling beside them
voc-n4-27-17|-|So sanh so luong (tu ~ tro len) - can so/bieu do co chu so, khong ve duoc
voc-n4-27-18|-|So sanh so luong (tu ~ tro xuong) - can so/bieu do co chu so, khong ve duoc
voc-n4-27-19|license|vocab|2|A plastic driver's license card with a small portrait photo and blank colored bands, lying next to a car key
voc-n4-27-20|disappointing|nhanvat|2|A person with slumped shoulders sighing sadly while watching the last bus drive away from the bus stop
voc-n4-28-1|continue|nhanvat|3|A runner jogging steadily along a long winding road that stretches to the horizon, a long trail of footprints far behind them
voc-n4-28-2|go-on-continue|canh|3|A long stone path that keeps continuing on and on through green fields, over hills and far into the distant horizon
voc-n4-28-3|commute|nhanvat|2|A student with a school bag riding a bicycle along a road toward a school in the morning, a dotted route line linking a small house to the school
voc-n4-28-4|tidy-up|nhanvat|1|A person putting scattered toys and books back onto shelves and into a box, one half of the room already neat and the other half still messy
voc-n4-28-5|-|Tu dong tu (duoc quyet dinh) - truu tuong, khong co hinh
voc-n4-28-6|daily-life|canh|3|A cozy cutaway view of a small Japanese apartment showing one person cooking in the kitchen corner, laundry drying by the window and a folded futon, everyday life at home
voc-n4-28-7|hobby|nhanvat|2|A person happily enjoying free time painting at an easel, with a guitar, a camera and a stack of books beside them
voc-n4-28-8|habit|nhanvat|3|A person brushing their teeth in front of a mirror next to a wall calendar grid where every single day is marked with the same check mark
voc-n4-28-9|rules|canh|3|A student reading a school hallway board of simple pictogram rules: a crossed-out running figure, a crossed-out phone and a finger-to-lips quiet icon
voc-n4-28-10|daily-life||||
voc-n4-28-11|exercise||||
voc-n4-28-12|walk-stroll|nhanvat|1|A person leisurely strolling along a tree-lined park path with hands behind the back, a small dog on a leash
voc-n4-28-13|music|vocab|1|A pair of headphones with colorful musical notes floating out of them
voc-n4-28-14|newspaper|vocab|1|A folded newspaper with columns of abstract gray lines instead of text and a photo box, lying on a table beside a cup of tea
voc-n4-28-15|coffee|vocab|1|A steaming mug of black coffee on a saucer with a few roasted coffee beans beside it
voc-n4-28-16|school|canh|1|A Japanese school building with a clock tower that has a blank face, a sports ground in front and a front gate
voc-n4-28-17|company|canh|1|A modern office building with glass windows and employees in suits walking in through the front doors
voc-n4-28-18|room|canh|1|A simple bedroom interior with a bed, a desk, a lamp and a window with curtains
voc-n4-28-19|-|Trang tu thoi gian lap lai (moi sang) - 'moi' khong the hien duoc bang mot hinh
voc-n4-28-20|alone|nhanvat|2|A single person sitting alone at a small table eating a bowl of ramen, empty chairs all around them
voc-n4-29-1|open-by-itself|canh|2|The automatic glass doors of a Japanese convenience store sliding open by themselves with no one touching them
voc-n4-29-2|open-window|nhanvat|1|A person pushing open a window with both hands, curtains blowing in a fresh breeze
voc-n4-29-3|close-by-itself|canh|2|Train doors sliding shut on their own at a station platform, the gap between them narrowing, no one touching them
voc-n4-29-4|close-door|nhanvat|1|A person pulling a wooden door shut by the handle
voc-n4-29-5|go-out-light|canh|2|A candle flame being blown out by a gust of wind in a dim room, a thin wisp of smoke rising from the wick
voc-n4-29-6|turn-off|nhanvat|1|A person pressing a wall light switch as the ceiling lamp above goes dark
voc-n4-29-7|begin|canh|2|Theater curtains rising on a stage as the seated audience applauds, a show just beginning
voc-n4-29-8|start-something|nhanvat|3|A person rolling up their sleeves and picking up a paintbrush in front of a blank canvas, about to begin painting
voc-n4-29-9|light-comes-on|canh|2|A table lamp flicking on in a dark room, warm light spreading out across the table
voc-n4-29-10|broken||||
voc-n4-29-11|break-something|nhanvat|2|A startled child who has accidentally knocked a ceramic vase off a table, the vase shattering on the floor
voc-n4-29-12|stop-park|nhanvat|2|A driver parking a small car neatly into a marked parking space, the car coming to rest at the line
voc-n4-29-13|quit-habit|nhanvat|2|A determined person snapping a cigarette in half and tossing a cigarette pack into a trash bin
voc-n4-29-14|electric-light|vocab|1|A glowing light bulb hanging from a ceiling cord, with an electric plug and wall socket nearby
voc-n4-29-15|window|vocab|1|A wooden framed window with open curtains showing blue sky and a tree outside
voc-n4-29-16|door|vocab|1|A Western-style wooden front door with a round brass doorknob and a small doormat
voc-n4-29-17|movie|canh|1|A cinema audience seen from behind watching a bright movie screen, a bucket of popcorn in the foreground
voc-n4-29-18|beautiful|canh|2|A breathtaking mountain lake at sunset with red autumn maple trees reflected in the still water
voc-n4-29-19|recall|nhanvat|3|A person holding an old photo and smiling nostalgically, a soft cloud-shaped thought bubble above showing a childhood memory of playing on a beach
voc-n4-29-20|suddenly|canh|3|A startled person on a sunny street as a sudden heavy downpour bursts from a single dark cloud directly above them
voc-n4-30-1|prepare|nhanvat|2|A person packing a suitcase with neatly folded clothes, a passport and a checklist of blank tick boxes beside them, getting ready for a trip
voc-n4-30-2|prepare||||
voc-n4-30-3|decorate|nhanvat|2|A person on a small step stool hanging paper garlands and balloons on a wall to decorate for a party
voc-n4-30-4|tidy-up||||
voc-n4-30-5|open-window||||
voc-n4-30-6|close-door||||
voc-n4-30-7|write|nhanvat|1|A person writing in a notebook with a pen at a desk, the page showing only wavy lines
voc-n4-30-8|buy|nhanvat|1|A customer handing yen coins to a cashier at a shop counter while receiving a shopping bag
voc-n4-30-9|look-up|nhanvat|2|A person searching through a thick dictionary with a magnifying glass, a laptop open beside them
voc-n4-30-10|reserve|nhanvat|3|A smiling person on the phone making a booking, with a thought bubble showing a restaurant table set for two with a small reserved placard
voc-n4-30-11|party|canh|1|A lively home party with friends raising glasses around a table of food, balloons and paper garlands
voc-n4-30-12|drinks|vocab|1|An assortment of drinks on a table: a glass of juice, a bottle of water, a cup of green tea and a mug of coffee
voc-n4-30-13|food|vocab|1|An assortment of foods on a table: a bowl of rice, onigiri rice balls, a plate of sushi, bread and fruit
voc-n4-30-14|flower|vocab|1|A bunch of colorful flowers in a simple vase
voc-n4-30-15|photo|vocab|1|A printed photograph with a white border showing a smiling family in front of a red torii gate, lying on a table
voc-n4-30-16|wall|vocab|2|A tall plain cream-colored wall of a room with a framed picture hanging on it and a potted plant at its base
voc-n4-30-17|map|vocab|1|A folded paper map with roads, a river, green parks and a red location pin
voc-n4-30-18|restaurant|canh|1|A cozy restaurant storefront with a plain noren curtain, paper lanterns and diners at tables visible through the window
voc-n4-30-19|-|Tu chi thoi gian (tuan sau) - lich khong co so thi khong phan biet duoc tuan sau/thang sau
voc-n4-30-20|-|Trang tu ngu phap (da, roi) - khong co hinh
voc-n4-31-1|lets-go|nhanvat|2|A group of cheerful friends with backpacks pointing forward together and setting off on an outing, one waving the others along
voc-n4-31-2|lets-eat|nhanvat|2|Friends seated around a table of food holding up chopsticks eagerly, about to start eating together
voc-n4-31-3|-|The y chi cua します (lam chung chung) - khong co hanh dong cu the de ve
voc-n4-31-4|-|The y chi cua 来ます - nghia ngu phap, khong ve duoc
voc-n4-31-5|decide|nhanvat|3|A person standing at a fork in a road, firmly pointing down one path with a determined nod
voc-n4-31-6|think|nhanvat|1|A person resting their chin on one hand with eyes looking upward in thought, a small cloud-shaped thought bubble with swirls above
voc-n4-31-7|plan|nhanvat|2|A person drawing a plan on a whiteboard with arrows connecting simple icons of an airplane, a hotel and a mountain
voc-n4-31-8|future|nhanvat|3|A young person standing on a hilltop looking toward a bright sunrise, a winding road leading ahead to a gleaming city on the horizon
voc-n4-31-9|dream|nhanvat|3|A child sleeping peacefully with a large dream bubble above showing them as an astronaut floating among stars
voc-n4-31-10|plan||||
voc-n4-31-11|university|canh|1|A grand university campus with a clock tower building that has a blank face, green lawns and students walking with books
voc-n4-31-12|university-student||||
voc-n4-31-13|company||||
voc-n4-31-14|work-job||||
voc-n4-31-15|teacher|nhanvat|1|A friendly teacher standing at a blackboard with simple drawn shapes, holding a pointer and smiling at the class
voc-n4-31-16|travel|canh|1|A traveler with a rolling suitcase and a camera standing in front of a red torii gate with Mount Fuji behind
voc-n4-31-17|study-abroad|nhanvat|2|A young student with a suitcase and backpack waving goodbye at an airport window as a plane takes off, a globe beside them
voc-n4-31-18|graduate|nhanvat|1|A smiling graduate in a gown and cap holding a rolled diploma tied with a ribbon, cherry blossoms around
voc-n4-31-19|work-hard-labor|nhanvat|1|A worker in a hard hat busily working on a construction site, carrying a wooden beam with sweat on the brow
voc-n4-31-20|do-ones-best|nhanvat|2|A student wearing a headband studying hard at a desk late at night, one fist clenched with determination
voc-n4-32-1|quit-habit||||
voc-n4-32-2|gain-weight|nhanvat|2|A surprised person standing on a bathroom scale looking down at their round belly, the scale needle swinging far over
voc-n4-32-3|lose-weight|nhanvat|2|A happy slimmer person holding out the waistband of loose, now far too big trousers to show how much weight they have lost
voc-n4-32-4|treat-cure|nhanvat|2|A doctor carefully bandaging a patient's injured arm in a clinic examination room
voc-n4-32-5|be-careful|nhanvat|2|A person walking slowly and carefully across a wet slippery floor with arms out for balance, eyes on their feet
voc-n4-32-6|dentist|nhanvat|1|A dentist in a mask examining a patient's open mouth with a small mirror, the patient reclining in a dental chair under a lamp
voc-n4-32-7|doctor|nhanvat|1|A doctor in a white coat with a stethoscope around the neck holding a clipboard
voc-n4-32-8|sick|nhanvat|1|A pale tired person lying in bed under a blanket, a medicine bottle, a glass of water and a thermometer on the nightstand
voc-n4-32-9|health|nhanvat|2|A glowing energetic person jogging in the morning sun holding an apple, fresh vegetables and a water bottle nearby
voc-n4-32-10|body-weight|vocab|1|A bathroom scale with a blank dial and two bare feet standing on it
voc-n4-32-11|habit||||
voc-n4-32-12|-|Trang tu uoc luong (dai khai) - truu tuong, khong co hinh
voc-n4-32-13|-|Trang tu phong doan (co le) - truu tuong, khong co hinh
voc-n4-32-14|-|Trang tu phong doan (biet dau) - truu tuong, khong co hinh
voc-n4-32-15|-|Trang tu nhan manh (tuyet doi) - truu tuong, khong co hinh
voc-n4-32-16|fever||||
voc-n4-32-17|medicine|vocab|1|Medicine tablets and capsules spilling from a small bottle beside a blister pack and a glass of water
voc-n4-32-18|hospital||||
voc-n4-32-19|exercise||||
voc-n4-32-20|cigarette|vocab|1|A single lit cigarette resting on a glass ashtray with a thin curl of smoke
voc-n4-33-1|run-command|nhanvat|3|A coach shouting through cupped hands and waving an arm to urge on a runner who is sprinting at full speed down a track
voc-n4-33-2|wait-command|nhanvat|3|A person thrusting out a flat palm and shouting at someone about to walk away, the other person freezing mid-step
voc-n4-33-3|hurry-command|nhanvat|3|A person frantically waving a friend to hurry toward a train that is about to depart, tapping a wristwatch
voc-n4-33-4|eat-command|nhanvat|3|A stern parent pointing firmly at a plate of vegetables in front of a reluctant child at the dinner table
voc-n4-33-5|come-here|nhanvat|3|A person crouching and making a palm-down beckoning gesture, calling a puppy to come over, the puppy running toward them
voc-n4-33-6|-|The menh lenh cua する (lam chung chung) - khong co hanh dong cu the de ve
voc-n4-33-7|no-entry|canh|2|A stern security guard crossing both arms in a big X shape in front of a rope barrier, beside a pictogram sign of a crossed-out walking figure
voc-n4-33-8|-|The cam chi (cam dung lai) - hinh de hieu nham thanh 'di tiep' hoac 'dung lai'
voc-n4-33-9|dangerous|canh|2|A person stepping dangerously close to a crumbling cliff edge with loose rocks falling below, a triangular warning sign nearby
voc-n4-33-10|caution-sign|vocab|2|A bright yellow triangular caution sign with a black pictogram of a person slipping, standing on a freshly mopped shiny floor
voc-n4-33-11|match-game|canh|2|Two soccer teams in different colored jerseys competing for the ball on a field, a referee running nearby
voc-n4-33-12|hurry|nhanvat|1|A person in a rush dashing along the sidewalk and glancing at a wristwatch, tie flying over the shoulder
voc-n4-33-13|run|nhanvat|1|A person running energetically in sportswear with arms pumping and motion lines behind them
voc-n4-33-14|manga|vocab|1|An open Japanese comic book showing cartoon characters in panels with empty speech balloons, a small stack of comic volumes beside it
voc-n4-33-15|study|nhanvat|1|A student sitting at a desk studying with an open textbook, a notebook and a pencil under a desk lamp
voc-n4-33-16|teacher||||
voc-n4-33-17|child|nhanvat|1|Two happy young children playing together with a ball
voc-n4-33-18|worry|nhanvat|2|A worried person biting their nails by a window at night, anxiously looking at a phone
voc-n4-33-19|cheer-on|nhanvat|2|Fans in the stands waving flags and pompoms, cheering on an exhausted runner who pushes on toward the finish line
voc-n4-33-20|watch-out|canh|2|A person pulling a child back by the arm just as a bicycle speeds past on the road right in front of them
voc-n4-34-1|explain|nhanvat|2|A person pointing at a simple diagram on a whiteboard, explaining it to a listener who nods in understanding
voc-n4-34-2|-|Dong tu 'lam' than mat chung chung - khong co hanh dong cu the de ve
voc-n4-34-3|make|nhanvat|1|A person in an apron making onigiri rice balls with both hands at a kitchen counter
voc-n4-34-4|teach|nhanvat|2|A kind adult guiding a child's hands on piano keys, teaching them to play
voc-n4-34-5|write||||
voc-n4-34-6|look-watch|nhanvat|1|A person looking through binoculars at birds perched in a tree
voc-n4-34-7|explain||||
voc-n4-34-8|manual|vocab|2|An open instruction manual with simple step-by-step pictures of assembling a chair, beside a half-assembled chair and a screwdriver
voc-n4-34-9|way-of-doing|nhanvat|3|A person carefully following a step-by-step picture guide to fold a paper crane, holding a half-folded crane
voc-n4-34-10|recipe|vocab|3|A recipe card with small illustrated steps of making curry rice, next to the ingredients: potatoes, carrots, onions and a pot
voc-n4-34-11|cooking-dish|vocab|1|A home-cooked Japanese meal on a tray: grilled fish, miso soup, a bowl of rice and pickles
voc-n4-34-12|teacher||||
voc-n4-34-13|match-game||||
voc-n4-34-14|meeting||||
voc-n4-34-15|class-lesson|canh|2|A classroom with students at desks raising their hands while a teacher gives a lesson at the blackboard
voc-n4-34-16|meal|canh|1|A family sitting together at a dining table sharing a meal of rice, soup and side dishes
voc-n4-34-17|study||||
voc-n4-34-18|tv|vocab|1|A flat-screen television on a low wooden stand showing a colorful landscape
voc-n4-34-19|homework|nhanvat|1|A child at a desk at home doing a workbook assignment with a pencil, a school backpack hanging on the chair
voc-n4-34-20|-|Danh tu hinh thuc (dung nhu) - nghia ngu phap, khong ve duoc
voc-n4-35-1|-|The dieu kien ば - nghia ngu phap 'neu', khong ve duoc
voc-n4-35-2|-|The dieu kien ば - nghia ngu phap 'neu', khong ve duoc
voc-n4-35-3|-|The dieu kien ば - nghia ngu phap 'neu', khong ve duoc
voc-n4-35-4|-|The dieu kien ば - nghia ngu phap 'neu', khong ve duoc
voc-n4-35-5|-|The dieu kien ば cua tinh tu - nghia ngu phap 'neu', khong ve duoc
voc-n4-35-6|-|The dieu kien なら - nghia ngu phap 'neu', khong ve duoc
voc-n4-35-7|countryside|canh|1|A peaceful Japanese countryside with green rice paddies, a small farmhouse with a tiled roof and mountains behind
voc-n4-35-8|city|canh|1|A bustling city with tall skyscrapers, busy streets full of cars and crowds of people
voc-n4-35-9|population|canh|3|A globe-shaped outline packed densely with countless tiny people figures standing shoulder to shoulder
voc-n4-35-10|inconvenient|canh|2|A tired frustrated person carrying heavy grocery bags along a long empty country road toward a shop far in the distance, no bus in sight
voc-n4-35-11|convenient|canh|2|A smiling person stepping out of a convenience store right next to their apartment, a train station and a bus stop just across the street
voc-n4-35-12|quiet|canh|1|A calm library corner with one person reading silently, finger to lips, soft light and no one else around
voc-n4-35-13|weather|vocab|1|A friendly sky scene with a sun, a cloud, raindrops and a snowflake arranged together like weather symbols
voc-n4-35-14|money|vocab|1|A pile of blank yen-style banknotes and gold and silver coins beside an open coin purse
voc-n4-35-15|time|vocab|2|An hourglass with sand flowing beside a round clock with a blank face and moving hands
voc-n4-35-16|travel||||
voc-n4-35-17|work-job||||
voc-n4-35-18|-|Ten ngon ngu (tieng Nhat) - can chu viet trong hinh, trai quy tac khong chu
voc-n4-35-19|dont-understand|nhanvat|2|A puzzled person tilting their head and scratching it with a confused frown, looking at a tangled diagram
voc-n4-35-20|teacher||||
voc-n4-36-1|can-hear|nhanvat|2|A person pausing on a quiet street and cupping a hand to their ear as soft sound waves from a distant temple bell ripple toward them
voc-n4-36-2|can-be-seen|canh|2|A person on a hilltop shading their eyes, a distant lighthouse naturally coming into view across the sea
voc-n4-36-3|forget|nhanvat|2|A person at the front door slapping their forehead, suddenly realizing they forgot the umbrella left behind on the shelf
voc-n4-36-4|continue||||
voc-n4-36-5|speak|nhanvat|1|Two people talking face to face, one speaking with gesturing hands and an empty speech bubble
voc-n4-36-6|exercise||||
voc-n4-36-8|explain||||
voc-n4-36-9|practice|nhanvat|2|A child practicing basketball shots over and over at a hoop, several balls scattered around their feet
voc-n4-36-10|glasses|vocab|1|A pair of round eyeglasses resting on an open book
voc-n4-36-11|ear|vocab|1|A friendly cartoon side profile of a head with the ear clearly highlighted
voc-n4-36-12|eye|vocab|1|A close-up of one friendly open eye with eyelashes and a sparkle in the pupil
voc-n4-36-13|voice|nhanvat|2|A person singing out loud with visible sound waves flowing from their mouth
voc-n4-36-14|-|Chu Han - can chu viet trong hinh, trai quy tac khong chu (KanjiVG dam nhiem)
voc-n4-36-15|-|Ten ngon ngu (tieng Nhat) - can chu viet trong hinh, trai quy tac khong chu
voc-n4-36-16|serious-diligent|nhanvat|2|A neat student sitting upright at a desk taking notes with a serious focused face while classmates behind are chatting
voc-n4-36-17|skillful|nhanvat|2|A person skillfully juggling five balls with ease while onlookers applaud
voc-n4-36-18|newspaper||||
voc-n4-36-19|sick||||
voc-n4-36-20|health||||
voc-n4-36-21|habit||||
voc-n4-37-1|be-scolded|nhanvat|2|A child standing with head down and teary eyes while a stern teacher with hands on hips scolds them
voc-n4-37-2|be-praised|nhanvat|2|A beaming child being patted on the head by a smiling teacher, holding up a test paper with a gold star
voc-n4-37-3|be-stolen|canh|2|A shocked person staring into their empty open handbag while a thief in the distance runs off with their wallet
voc-n4-37-4|be-stepped-on|nhanvat|2|On a crowded train, a person wincing in pain as another passenger's shoe steps on their foot
voc-n4-37-5|cried-on|nhanvat|3|A tired troubled young man on a train seat looking awkward and bothered while a baby next to him cries loudly
voc-n4-37-6|surprise-people|nhanvat|3|A crowd of people jumping back in astonishment with wide eyes as a magician pulls a rabbit out of a hat
voc-n4-37-7|be-built|canh|2|A tall building under construction with scaffolding and a crane lifting a steel beam
voc-n4-37-8|be-invited|nhanvat|2|A delighted person opening an envelope and pulling out a decorated invitation card with a ribbon
voc-n4-37-9|be-made|canh|2|Cars being assembled on a factory production line by robotic arms
voc-n4-37-10|-|Bi dong 'duoc goi la' - can ten goi/chu, khong ve duoc
voc-n4-37-11|teacher||||
voc-n4-37-12|thief|nhanvat|1|A sneaky cartoon thief in a striped shirt and eye mask tiptoeing with a sack over the shoulder
voc-n4-37-13|wallet|vocab|1|A brown leather wallet slightly open with a blank banknote and a card peeking out
voc-n4-37-14|rain|canh|1|Rain falling from gray clouds onto puddles on a street, a person walking under an umbrella
voc-n4-37-15|train||||
voc-n4-37-16|foot-leg|vocab|1|A pair of bare legs and feet standing on the floor with the toes clearly visible
voc-n4-37-17|party||||
voc-n4-37-18|all-over-world|vocab|3|A globe with little people of many countries holding hands all around it, tiny landmarks dotted across the continents
voc-n4-37-19|famous|nhanvat|2|A celebrity in sunglasses surrounded by excited fans holding out notebooks and cameras flashing
voc-n4-37-20|factory|canh|1|A factory building with tall chimneys, a sawtooth roof and trucks loading at the gate
voc-n4-38-1|swimming||||
voc-n4-38-2|dance|nhanvat|1|A cheerful person dancing with arms raised and one leg lifted, musical notes around them
voc-n4-38-3|sing|nhanvat|1|A person singing happily into a microphone at karaoke
voc-n4-38-4|close-door||||
voc-n4-38-5|turn-off||||
voc-n4-38-6|bring|nhanvat|2|A guest arriving at a friend's door carrying a cake box and a bottle of juice brought along as gifts
voc-n4-38-7|contact|nhanvat|2|A person sending a message on a smartphone, a small envelope icon flying toward a friend's phone far away
voc-n4-38-8|hobby||||
voc-n4-38-9|swimming||||
voc-n4-38-10|habit||||
voc-n4-38-11|picture|vocab|1|A framed landscape painting standing on an easel with a paint palette and brushes
voc-n4-38-12|song|vocab|1|A small radio playing with a stream of colorful musical notes flowing out along a curving staff line
voc-n4-38-13|window||||
voc-n4-38-14|umbrella|vocab|1|An open red umbrella with a curved handle, raindrops bouncing off it
voc-n4-38-15|electric-light||||
voc-n4-38-16|promise|nhanvat|2|Two children hooking their pinky fingers together in a pinky promise, smiling at each other
voc-n4-38-17|homework||||
voc-n4-38-18|listen|nhanvat|1|A person wearing headphones with eyes closed, listening to music
voc-n4-38-19|look-watch||||
voc-n4-38-20|speak||||
voc-n4-39-1|take-day-off|nhanvat|2|A person resting at home on a weekday in pajamas, lounging on a sofa with a cup of tea while a work bag sits unused by the door
voc-n4-39-2|be-late||||
voc-n4-39-3|in-trouble|nhanvat|2|A troubled person standing in the rain in front of a locked door, patting empty pockets after losing their key
voc-n4-39-4|come-to-stop|canh|2|A car coming to a halt at a red traffic light with a small puff of dust behind its tires
voc-n4-39-5|prepare||||
voc-n4-39-6|typhoon|canh|1|A typhoon with swirling winds bending palm trees, heavy rain slanting sideways and an umbrella flipped inside out
voc-n4-39-7|-|Viec rieng/viec ban - nghia chung chung, hinh khong xac dinh duoc
voc-n4-39-8|accident||||
voc-n4-39-9|traffic|canh|1|A busy intersection with cars, buses and bicycles, a traffic light and pedestrians on a zebra crossing
voc-n4-39-10|train||||
voc-n4-39-11|sick||||
voc-n4-39-12|work-job||||
voc-n4-39-13|school||||
voc-n4-39-14|meeting||||
voc-n4-39-15|deep-apology|nhanvat|2|An office worker bowing very deeply at a right angle in apology to an upset customer
voc-n4-39-16|-|Cau nghi thuc xin phep khi vao/ra phong - hinh cui chao khong phan biet duoc voi loi chao khac
voc-n4-39-17|suddenly||||
voc-n4-39-18|tough-hard|nhanvat|2|An exhausted person carrying a towering stack of heavy boxes up a steep staircase, sweating
voc-n4-39-19|worry||||
voc-n4-39-20|its-okay||||
voc-n4-40-1|look-up||||
voc-n4-40-2|try-eating|nhanvat|2|A curious person cautiously tasting sticky natto from chopsticks for the first time, eyebrows raised
voc-n4-40-3|try-on|nhanvat|2|A person trying on a new jacket in front of a fitting room mirror, turning to check the look
voc-n4-40-4|give-it-a-try|nhanvat|3|A nervous but excited beginner stepping onto a skateboard for the first time with arms out for balance
voc-n4-40-5|ask|nhanvat|2|A tourist asking a station staff member for directions, pointing at a map while the staff member listens and points the way
voc-n4-40-6|dont-understand||||
voc-n4-40-7|taste|vocab|2|A person savoring a spoonful of soup with closed eyes, surrounded by a strawberry, a pinch of salt, a lemon slice and a chili pepper
voc-n4-40-8|interest|nhanvat|2|A child pressing their face close to an aquarium glass, eyes sparkling with fascination at the colorful fish
voc-n4-40-9|hobby||||
voc-n4-40-10|weather||||
voc-n4-40-11|exam|canh|2|Students at separate desks silently taking a written exam with heads down, a proctor watching from the front
voc-n4-40-12|pass-exam|nhanvat|2|A student jumping for joy in front of a board of blank result cards, pointing at one highlighted with a bright gold star
voc-n4-40-13|cooking-dish||||
voc-n4-40-14|clothes|vocab|1|A neat pile of folded clothes: a shirt, trousers, a sweater and a skirt
voc-n4-40-15|size|vocab|2|Three T-shirts in small, medium and large sizes lined up side by side with a measuring tape
voc-n4-40-16|fit|nhanvat|2|A person happily slipping on a shoe that fits perfectly and snugly, admiring it
voc-n4-40-17|phone-call|nhanvat|1|A person holding a smartphone to their ear, talking happily on a phone call
voc-n4-40-18|-|Danh tu truu tuong (su that) - khong co hinh
voc-n4-40-19|teacher||||
voc-n4-40-20|its-okay||||
voc-n4-41-1|feed-animal|nhanvat|2|A person pouring food into a bowl for an eager dog wagging its tail
voc-n4-41-2|give|nhanvat|1|A person handing a wrapped gift box to a smiling friend
voc-n4-41-3|present-humbly|nhanvat|3|A young person bowing respectfully while presenting a gift with both hands to an elderly teacher
voc-n4-41-4|receive-humbly|nhanvat|3|A young employee bowing gratefully while receiving a gift with both hands from a senior boss
voc-n4-41-5|kindly-give|nhanvat|3|A kind elderly teacher warmly handing a book down to a grateful young student who bows
voc-n4-41-6|receive|nhanvat|1|A delighted child receiving a wrapped present from a friend with both hands
voc-n4-41-7|give-to-me|nhanvat|3|First-person view of my own hands receiving a gift box from a smiling friend across the table
voc-n4-41-8|present-gift|vocab|1|A wrapped gift box with a big ribbon bow
voc-n4-41-9|hanami|canh|1|Friends having a picnic on a blue sheet under blooming cherry blossom trees, petals drifting down
voc-n4-41-10|teacher||||
voc-n4-41-11|company-president|nhanvat|2|A dignified company president in a fine suit sitting in a large leather chair behind a big executive desk
voc-n4-41-12|parents|nhanvat|1|A mother and father standing side by side smiling warmly
voc-n4-41-13|birthday|canh|1|A birthday cake with lit candles, party hats and a wrapped present
voc-n4-41-14|flower||||
voc-n4-41-15|book|vocab|1|A hardcover book standing slightly open with a ribbon bookmark
voc-n4-41-16|dog|vocab|1|A friendly shiba inu dog sitting and wagging its tail
voc-n4-41-17|water|vocab|1|A clear glass of water beside a glass pitcher
voc-n4-41-18|company-employee|nhanvat|1|An office employee in a suit with a lanyard ID badge holding a laptop bag
voc-n4-41-19|customer|nhanvat|2|A shop clerk bowing to welcome a customer walking in through the store entrance
voc-n4-41-20|grateful|nhanvat|3|A person with hands pressed together in heartfelt gratitude toward a neighbor who helped carry heavy bags
voc-n4-42-1|use|nhanvat|1|A person using a screwdriver to fix a wobbly chair
voc-n4-42-2|save-money|nhanvat|2|A person dropping a coin into a piggy bank that is filling up with coins
voc-n4-42-3|work-hard-labor||||
voc-n4-42-4|study||||
voc-n4-42-5|useful|nhanvat|3|During a blackout, a relieved person switching on a flashlight that lights up the dark room so they can find their way
voc-n4-42-6|study-abroad||||
voc-n4-42-7|future||||
voc-n4-42-8|tools|vocab|1|A toolbox with a hammer, a screwdriver, a wrench and pliers laid out beside it
voc-n4-42-9|money||||
voc-n4-42-10|rich-person|nhanvat|2|A wealthy person in a luxury suit sitting on a pile of gold coins, a mansion and a fancy car behind
voc-n4-42-11|cooking-dish||||
voc-n4-42-12|time||||
voc-n4-42-13|health||||
voc-n4-42-14|exam||||
voc-n4-42-15|pass-exam||||
voc-n4-42-16|university||||
voc-n4-42-17|scissors|vocab|1|A pair of scissors with orange handles, blades slightly open
voc-n4-42-18|paper|vocab|1|A small neat stack of blank white paper sheets
voc-n4-42-19|cut|nhanvat|1|Hands cutting a sheet of paper with scissors, a strip curling away
voc-n4-42-20|convenient||||
voc-n4-43-1|fall-rain-snow|canh|1|Heavy rain and snowflakes falling down from a gray cloud onto rooftops and a street below
voc-n4-43-2|fall-over|nhanvat|2|A person tripping over a stone and falling forward with arms flung out
voc-n4-43-3|broken||||
voc-n4-43-4|cry|nhanvat|1|A child crying with big tears streaming down their cheeks, mouth open wailing
voc-n4-43-5|drop-fall|canh|2|An apple falling from a tree branch, caught mid-air above the grass with motion lines
voc-n4-43-6|tired|nhanvat|1|An exhausted office worker slumped over a desk, eyes half-closed and arms dangling
voc-n4-43-7|sleepy|nhanvat|1|A person yawning widely and rubbing their eyes, head drooping at a desk
voc-n4-43-8|delicious|nhanvat|1|A person taking a bite of sushi with a blissful expression and glowing cheeks
voc-n4-43-9|bitter|nhanvat|2|A person grimacing with a scrunched-up face and tongue out after sipping bitter herbal medicine tea
voc-n4-43-10|fun|canh|1|Friends laughing together with arms up while riding a roller coaster
voc-n4-43-11|busy|nhanvat|1|A busy office worker juggling a phone, papers and a laptop all at once at a cluttered desk
voc-n4-43-12|energetic|nhanvat|1|A cheerful energetic child jumping high with arms spread wide under the sun
voc-n4-43-13|kind|nhanvat|2|A young person kindly helping an elderly woman carry her heavy bag across the street
voc-n4-43-14|rain||||
voc-n4-43-15|cloud|vocab|1|Fluffy white clouds floating in a blue sky
voc-n4-43-16|tree|vocab|1|A single large leafy tree with a sturdy trunk on a small patch of grass
voc-n4-43-17|chair|vocab|1|A simple wooden chair with four legs and a backrest
voc-n4-43-18|child||||
voc-n4-43-19|medicine||||
voc-n4-43-20|weather||||
voc-n4-44-1|eat|nhanvat|1|A person eating a bowl of rice with chopsticks
voc-n4-44-2|drink|nhanvat|1|A person drinking a glass of water, head tilted back slightly
voc-n4-44-3|work-hard-labor||||
voc-n4-44-4|use||||
voc-n4-44-5|walk|nhanvat|1|A person walking briskly along a sidewalk mid-stride
voc-n4-44-6|read|nhanvat|1|A person sitting in an armchair reading a book
voc-n4-44-7|write||||
voc-n4-44-8|drive||||
voc-n4-44-9|gain-weight||||
voc-n4-44-10|explain||||
voc-n4-44-11|tall|vocab|2|A very tall skyscraper towering high over a row of tiny houses beside it
voc-n4-44-12|cheap|canh|2|A delighted shopper grabbing items from an overflowing bargain bin with a price tag showing a big downward arrow
voc-n4-44-13|big|vocab|1|A huge elephant standing next to a tiny mouse, emphasizing big size
voc-n4-44-14|difficult|nhanvat|2|A student staring at a tangled, complicated maze puzzle, sweating and holding their head in both hands
voc-n4-44-15|energetic||||
voc-n4-44-16|quiet||||
voc-n4-44-17|shoes|vocab|1|A pair of sneakers placed neatly side by side
voc-n4-44-18|-|Chu viet - can chu trong hinh, trai quy tac khong chu
voc-n4-44-19|manual||||
voc-n4-44-20|sick||||
voc-n4-45-1|do-ones-best||||
voc-n4-45-2|fail|nhanvat|2|A dejected person sitting beside a collapsed tower of wooden blocks they were building, pieces scattered on the floor
voc-n4-45-3|pass-exam||||
voc-n4-45-4|go-out|nhanvat|1|A person stepping out of the front door with a bag, waving goodbye
voc-n4-45-5|contact||||
voc-n4-45-6|-|Danh tu truu tuong (truong hop) - nghia ngu phap, khong ve duoc
voc-n4-45-7|earthquake|canh|1|A room shaking in an earthquake with a lamp swinging, books falling from shelves and a person ducking under a table
voc-n4-45-8|fire|canh|1|A house on fire with flames coming out of the windows and a red fire truck spraying water
voc-n4-45-9|typhoon||||
voc-n4-45-10|all-out|nhanvat|2|A runner giving it everything with a straining face and clenched fists, sprinting at full power toward the finish tape
voc-n4-45-11|disappointing||||
voc-n4-45-12|exam||||
voc-n4-45-13|weather||||
voc-n4-45-14|rain||||
voc-n4-45-15|hospital||||
voc-n4-45-16|elevator|vocab|1|Elevator doors standing open with up and down arrow buttons beside them
voc-n4-45-17|stairs|vocab|1|A flight of indoor stairs with a wooden handrail going up
voc-n4-45-18|telephone|vocab|1|A classic landline telephone with a coiled cord next to a smartphone
voc-n4-45-19|promise||||
voc-n4-45-20|homework||||
voc-n4-46-1|eat||||
voc-n4-46-2|go-out||||
voc-n4-46-3|begin||||
voc-n4-46-4|finish|canh|2|A runner breaking through the finish line tape with arms raised in the air
voc-n4-46-5|come|nhanvat|2|A friend walking toward the viewer along a garden path, waving hello as they arrive
voc-n4-46-6|go-home|nhanvat|1|A person arriving home in the evening, opening the front door under a warm porch light and taking off shoes at the genkan
voc-n4-46-7|arrive|canh|2|A traveler with a suitcase stepping off a train onto the destination platform, looking relieved
voc-n4-46-8|wake-up|nhanvat|1|A person sitting up in bed stretching and yawning as the morning sun comes through the window
voc-n4-46-9|study||||
voc-n4-46-10|phone-call||||
voc-n4-46-11|-|Trang tu (vua dung) - truu tuong, khong co hinh
voc-n4-46-12|-|Tu chi thoi diem (bay gio) - truu tuong, khong co hinh
voc-n4-46-13|station|canh|1|A small Japanese train station building with a platform and a train pulling in
voc-n4-46-14|meeting||||
voc-n4-46-15|class-lesson||||
voc-n4-46-16|work-job||||
voc-n4-46-17|movie||||
voc-n4-46-18|photo||||
voc-n4-46-19|train||||
voc-n4-46-20|birthday||||
voc-n4-47-1|move-house|nhanvat|2|People carrying cardboard boxes from a moving truck into a new apartment
voc-n4-47-2|marry|nhanvat|1|A bride in a white dress and a groom in a suit holding hands under falling flower petals
voc-n4-47-3|quit-job|nhanvat|2|An office worker carrying a box of desk belongings out of the office after handing a plain white envelope to the boss
voc-n4-47-4|sick||||
voc-n4-47-5|fall-rain-snow||||
voc-n4-47-6|tired||||
voc-n4-47-7|energetic||||
voc-n4-47-8|weather-forecast|canh|2|A TV weather presenter standing beside a map of Japan dotted with sun, cloud and umbrella icons
voc-n4-47-9|rumor|nhanvat|2|Two people whispering behind their hands while glancing sideways at a third person
voc-n4-47-10|-|Ten ngon ngu (tieng Nhat) - can chu viet trong hinh, trai quy tac khong chu
voc-n4-47-11|teacher||||
voc-n4-47-12|newspaper||||
voc-n4-47-13|news|canh|2|A TV news anchor at a desk on a television screen, a small inset picture of a city behind them
voc-n4-47-14|company||||
voc-n4-47-15|hospital||||
voc-n4-47-16|typhoon||||
voc-n4-47-17|-|Tu chi thoi gian (tuan sau) - lich khong co so thi khong phan biet duoc tuan sau/thang sau
voc-n4-47-18|-|Tu chi thoi gian (thang sau) - lich khong co so thi khong phan biet duoc tuan sau/thang sau
voc-n4-47-19|happy|nhanvat|2|A family of three laughing and hugging warmly on a sunny porch, glowing with happiness
voc-n4-47-20|-|Danh tu truu tuong (su that) - khong co hinh
voc-n4-48-1|make-go|nhanvat|3|A mother pointing firmly out the front door, sending a reluctant child off to school with a backpack
voc-n4-48-2|make-eat|nhanvat|3|A parent spoon-feeding vegetables to a young child sitting in a high chair
voc-n4-48-3|-|The sai khien cua します (lam chung chung) - khong co hanh dong cu the de ve
voc-n4-48-4|make-come|nhanvat|3|A boss at a desk beckoning an employee across the office to come over, the employee hurrying toward them
voc-n4-48-5|make-help|nhanvat|3|A mother handing a dish towel to a child and having them help dry the dishes in the kitchen
voc-n4-48-6|make-tidy|nhanvat|3|A parent pointing at scattered toys on the floor while a child reluctantly picks them up into a box
voc-n4-48-7|let-rest|nhanvat|3|A kind boss holding the door open and gently gesturing for a feverish employee to go home and rest
voc-n4-48-8|make-study|nhanvat|3|A strict parent standing behind a child at a desk with arms crossed, making them do their workbook
voc-n4-48-9|make-exercise|nhanvat|3|A coach blowing a whistle while a line of students runs laps around a school track
voc-n4-48-10|child||||
voc-n4-48-11|parents||||
voc-n4-48-12|teacher||||
voc-n4-48-13|student|nhanvat|1|A student in a Japanese school uniform holding books
voc-n4-48-14|vegetables|vocab|1|A basket of fresh vegetables: carrots, cabbage, tomatoes and a daikon radish
voc-n4-48-15|company-president||||
voc-n4-48-16|company-employee||||
voc-n4-48-17|sick||||
voc-n4-48-18|homework||||
voc-n4-48-19|room||||
voc-n4-48-20|-|Danh tu truu tuong (cam giac, tam trang) - khong co mot hinh cu the
voc-n4-49-1|-|Kinh ngu da nghia (la/co/den/di) - khong mot hinh nao day dung
voc-n4-49-2|-|Kinh ngu cua 言います - hinh trung voi 'noi', diem can day la sac thai ton kinh
voc-n4-49-3|-|Kinh ngu cua します (lam chung chung) - khong co hanh dong cu the de ve
voc-n4-49-4|honorific-eat|nhanvat|3|An elderly guest in a kimono eating an elegant meal while the host kneels beside them and bows respectfully serving tea
voc-n4-49-5|honorific-see|nhanvat|3|A respected elderly guest viewing a painting in a gallery while a staff member gestures toward it deferentially with a slight bow
voc-n4-49-6|kindly-give||||
voc-n4-49-7|-|Kinh ngu mau お~になります cua 読みます - hinh trung voi 'doc', diem can day la ngu phap
voc-n4-49-8|-|Kinh ngu mau お~になります cua 書きます - hinh trung voi 'viet', diem can day la ngu phap
voc-n4-49-9|company-president||||
voc-n4-49-10|dept-manager|nhanvat|2|A department manager sitting at a desk at the head of rows of office desks, overseeing the staff working in front
voc-n4-49-11|section-chief|nhanvat|3|A section chief leading a small huddle of four employees, pointing at a clipboard as they listen
voc-n4-49-12|principal|nhanvat|2|A school principal in a suit giving a speech at a podium in front of rows of students in a school gym
voc-n4-49-13|customer||||
voc-n4-49-14|your-home|canh|3|A visitor bowing at the entrance of someone's Japanese house holding a gift bag as the host welcomes them at the genkan
voc-n4-49-15|teacher||||
voc-n4-49-16|newspaper||||
voc-n4-49-17|photo||||
voc-n4-49-18|lecture|canh|2|A speaker giving a lecture on stage beside a projection screen to a large seated audience
voc-n4-49-19|meal||||
voc-n4-49-20|green-tea|vocab|1|A cup of green tea in a Japanese yunomi cup beside a small teapot
voc-n4-50-1|-|Khiem nhuong ngu cua 行きます/来ます - nghia ngu phap, hinh khong phan biet duoc
voc-n4-50-2|self-introduce-humbly|nhanvat|3|A businessperson bowing politely while offering a business card with both hands, introducing themselves
voc-n4-50-3|-|Khiem nhuong ngu trang trong cua 言います - hinh khong phan biet duoc voi 'noi'
voc-n4-50-4|-|Khiem nhuong ngu cua します (lam chung chung) - khong co hanh dong cu the de ve
voc-n4-50-5|receive-humbly||||
voc-n4-50-6|humble-see|nhanvat|3|A young employee bowing slightly while respectfully looking at a document held out by a senior boss
voc-n4-50-7|-|Khiem nhuong ngu cua 知っています/思います - truu tuong, khong co hinh
voc-n4-50-8|-|Khiem nhuong ngu cua います - nghia ngu phap, khong co hinh
voc-n4-50-9|guide|nhanvat|2|A hotel staff member guiding a guest down a hallway, gesturing ahead with an open palm
voc-n4-50-10|guide||||
voc-n4-50-11|meeting-room||||
voc-n4-50-12|company-president||||
voc-n4-50-13|customer||||
voc-n4-50-14|letter|vocab|1|A sealed envelope with a stamp and a folded letter partly sticking out
voc-n4-50-15|thank-you-gift|nhanvat|2|A person bowing while handing a wrapped thank-you gift box to a neighbor
voc-n4-50-16|question|nhanvat|2|A student raising a hand high in class to ask a question
voc-n4-50-17|explain||||
voc-n4-50-18|telephone||||
voc-n4-50-19|documents|vocab|1|A stack of printed documents with bar charts and a binder clip on a meeting table
voc-n4-50-20|-|Ten goi - can chu viet trong hinh, trai quy tac khong chu
"""

# negative bo sung rieng cho mot so ten (ngoai NEG chung)
NEG_THEM = {
    "hospital": "red cross emblem",
    "newspaper": "headline, readable print",
    "manga": "readable dialogue",
    "manual": "readable instructions",
    "recipe": "handwritten text",
    "money": "denomination numbers, portraits on banknotes",
    "wallet": "denomination numbers",
    "license": "readable id number, name text",
    "time": "clock numerals",
    "school": "clock numerals",
    "university": "clock numerals",
    "oversleep": "clock numerals, digital time display",
    "rules": "written rules, words on sign",
    "caution-sign": "written warning words",
    "no-entry": "written words on sign",
    "dangerous": "written warning words",
    "weather-forecast": "temperature numbers, city names",
    "news": "news ticker text, headline",
    "pass-exam": "names, numbers on board",
    "exam": "clock numerals, printed questions",
    "documents": "readable text, chart numbers",
    "tv": "channel logo",
    "cheap": "price numbers, percent sign",
    "size": "size letters, S M L letters",
    "elevator": "floor numbers",
    "study": "readable textbook text",
    "homework": "readable text",
    "write": "readable handwriting",
    "can-write": "readable handwriting",
    "letter": "address text, postmark text",
    "photo": "caption",
    "cigarette": "glamorous, brand pack",
    "quit-habit": "brand pack",
    "rich-person": "dollar sign",
    "save-money": "dollar sign",
    "buy": "price tag numbers, dollar sign",
    "all-over-world": "country names",
    "population": "numbers, statistics text",
    "plan": "written words on whiteboard",
    "explain": "written words on whiteboard",
    "meeting": "written words on whiteboard",
    "self-introduce-humbly": "readable business card text",
    "humble-see": "readable document text",
    "be-praised": "score numbers",
}

def doc_giao_trinh():
    # doc vocabList N4 theo thu tu bai
    ds = []
    for so in range(26, 51):
        with open(os.path.join(GOC, "n4", f"{so}.json"), encoding="utf-8") as f:
            d = json.load(f)
        for v in d.get("vocabList", []):
            ds.append(v)
    return ds

def doc_n5():
    # khoa (kanji hoac word, word) -> id N5 de danh dau trung cap do
    m = {}
    for so in range(1, 26):
        with open(os.path.join(GOC, "n5", f"{so}.json"), encoding="utf-8") as f:
            d = json.load(f)
        for v in d.get("vocabList", []):
            k = (v.get("kanji") or v["word"], v["word"])
            m.setdefault(k, v["id"])
    return m

def main():
    vocab = doc_giao_trinh()
    n5 = doc_n5()
    theo_id = {v["id"]: v for v in vocab}

    dong = {}
    thu_tu = []
    for ln in BANG.strip().splitlines():
        p = ln.split("|")
        thu_tu.append(p[0])
        dong[p[0]] = p

    # kiem tra phu du 500 muc
    thieu = [v["id"] for v in vocab if v["id"] not in dong]
    thua = [i for i in dong if i not in theo_id]
    if thieu or thua:
        print("THIEU:", thieu, "THUA:", thua); sys.exit(1)

    dinh_nghia = {}   # ten -> (loai, kho, cau)
    items, skipped = [], []
    for v in vocab:
        p = dong[v["id"]]
        if p[1] == "-":
            sk = {"id": v["id"], "word": v["word"], "kanji": v.get("kanji", ""), "meaningVi": v["meaningVi"], "reason": p[2]}
            skipped.append(sk)
            continue
        ten = p[1]
        cau = p[4].strip() if len(p) > 4 else ""
        dung_lai = None
        if cau:
            if ten in dinh_nghia:
                print("TRUNG DINH NGHIA:", ten, v["id"]); sys.exit(1)
            dinh_nghia[ten] = (p[2], int(p[3]), cau, v["id"])
        else:
            if ten not in dinh_nghia:
                print("DUNG LAI TRUOC KHI DINH NGHIA:", ten, v["id"]); sys.exit(1)
            dung_lai = ten
        loai, kho, cau, goc = dinh_nghia[ten]
        if "text" in cau.lower() or "letter " in cau.lower():
            pass
        neg = NEG + (", " + NEG_THEM[ten] if ten in NEG_THEM else "")
        it = {
            "id": v["id"],
            "word": v["word"],
            "kanji": v.get("kanji", ""),
            "meaningVi": v["meaningVi"],
            "ten": ten,
            "prompt": cau + ".",
            "negative": neg,
            "loai": loai,
            "kho": kho,
        }
        if dung_lai:
            it["dungLai"] = dung_lai
            it["dungLaiTu"] = goc
        k5 = n5.get((v.get("kanji") or v["word"], v["word"]))
        if k5:
            it["trungN5"] = k5
        items.append(it)

    so_anh = len(dinh_nghia)
    out = {
        "level": "n4",
        "model": "Qwen-Image-2512",
        "style": STYLE,
        "styleNote": "Noi prompt + ', ' + style. Mau goc app: nen #f0ebe1, terracotta #c96442, sage #6b8a5e, muc #1f1d19 (khong dua ma hex vao prompt de tranh model ve chu).",
        "negativeBase": NEG,
        "size": "1328x1328",
        "thongKe": {
            "tongMuc": len(vocab),
            "coPrompt": len(items),
            "anhDuyNhat": so_anh,
            "dungLaiTrongN4": sum(1 for i in items if "dungLai" in i),
            "trungN5": sum(1 for i in items if "trungN5" in i),
            "boQua": len(skipped),
            "tiLeBoQua": round(len(skipped) / len(vocab), 3),
        },
        "items": items,
        "skipped": skipped,
    }
    with open(os.path.join(RA, "prompt-n4.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(json.dumps(out["thongKe"], ensure_ascii=False))

if __name__ == "__main__":
    main()
