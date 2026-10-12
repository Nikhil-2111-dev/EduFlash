from PIL import Image, ImageDraw

img = Image.new('RGB', (800, 600), color='#ffffff')
draw = ImageDraw.Draw(img)

# Title
draw.text((230, 30), "TCP 4-WAY CONNECTION TEARDOWN", fill='#000000')

# Columns
draw.rectangle([100, 80, 260, 130], outline='#000000', width=3, fill='#f0f0f0')
draw.text((130, 95), "CLIENT (Host A)", fill='#000000')

draw.rectangle([540, 80, 700, 130], outline='#000000', width=3, fill='#f0f0f0')
draw.text((570, 95), "SERVER (Host B)", fill='#000000')

# Lifelines
draw.line([(180, 130), (180, 520)], fill='#000000', width=2)
draw.line([(620, 130), (620, 520)], fill='#000000', width=2)

# Initial State
draw.text((120, 140), "State: ESTABLISHED", fill='#008000')
draw.text((560, 140), "State: ESTABLISHED", fill='#008000')

# Step 1: FIN
draw.line([(180, 200), (620, 240)], fill='#d02020', width=4)
draw.polygon([(620, 240), (600, 230), (605, 245)], fill='#d02020')
draw.text((330, 205), "1. FIN (seq = u)", fill='#d02020')
draw.text((70, 210), "State: FIN-WAIT-1", fill='#d02020')

# Step 2: ACK
draw.line([(620, 290), (180, 330)], fill='#1040c0', width=4)
draw.polygon([(180, 330), (200, 320), (195, 335)], fill='#1040c0')
draw.text((320, 295), "2. ACK (ack = u+1)", fill='#1040c0')
draw.text((630, 295), "State: CLOSE-WAIT", fill='#1040c0')
draw.text((70, 340), "State: FIN-WAIT-2", fill='#1040c0')

# Step 3: FIN
draw.line([(620, 390), (180, 430)], fill='#d02020', width=4)
draw.polygon([(180, 430), (200, 420), (195, 435)], fill='#d02020')
draw.text((320, 395), "3. FIN (seq = w, ack = u+1)", fill='#d02020')
draw.text((630, 410), "State: LAST-ACK", fill='#d02020')

# Step 4: ACK
draw.line([(180, 470), (620, 500)], fill='#008000', width=4)
draw.polygon([(620, 500), (600, 490), (605, 505)], fill='#008000')
draw.text((330, 475), "4. ACK (ack = w+1)", fill='#008000')
draw.text((70, 480), "State: TIME-WAIT (2MSL)", fill='#f0c020')
draw.text((630, 500), "State: CLOSED", fill='#000000')

# Teardown Rule Note
draw.rectangle([160, 535, 640, 580], outline='#121212', width=2, fill='#f0c020')
draw.text((180, 550), "RULE: Client remains in TIME-WAIT for 2MSL before fully closing.", fill='#121212')

img.save('/home/nikhil/EduFlash/test_diagram_part2.png', 'PNG')
print("Successfully generated /home/nikhil/EduFlash/test_diagram_part2.png")
