from PIL import Image, ImageDraw, ImageFont

img = Image.new('RGB', (800, 600), color='#ffffff')
draw = ImageDraw.Draw(img)

# Draw Title
draw.text((250, 30), "TCP 3-WAY HANDSHAKE FLOW", fill='#000000')

# Draw Columns
draw.rectangle([100, 80, 260, 130], outline='#000000', width=3, fill='#f0f0f0')
draw.text((130, 95), "CLIENT (Host A)", fill='#000000')

draw.rectangle([540, 80, 700, 130], outline='#000000', width=3, fill='#f0f0f0')
draw.text((570, 95), "SERVER (Host B)", fill='#000000')

# Lifelines
draw.line([(180, 130), (180, 520)], fill='#000000', width=2)
draw.line([(620, 130), (620, 520)], fill='#000000', width=2)

# Step 1: SYN
draw.line([(180, 200), (620, 250)], fill='#d02020', width=4)
draw.polygon([(620, 250), (600, 240), (605, 255)], fill='#d02020')
draw.text((320, 205), "1. SYN (seq = x)", fill='#d02020')
draw.text((80, 210), "State: SYN-SENT", fill='#1040c0')

# Step 2: SYN-ACK
draw.line([(620, 320), (180, 370)], fill='#1040c0', width=4)
draw.polygon([(180, 370), (200, 360), (195, 375)], fill='#1040c0')
draw.text((310, 325), "2. SYN-ACK (seq = y, ack = x+1)", fill='#1040c0')
draw.text((630, 325), "State: SYN-RECEIVED", fill='#1040c0')

# Step 3: ACK
draw.line([(180, 440), (620, 490)], fill='#008000', width=4)
draw.polygon([(620, 490), (600, 480), (605, 495)], fill='#008000')
draw.text((330, 445), "3. ACK (ack = y+1)", fill='#008000')
draw.text((80, 460), "State: ESTABLISHED", fill='#008000')
draw.text((630, 490), "State: ESTABLISHED", fill='#008000')

# Rule Note
draw.rectangle([180, 530, 620, 580], outline='#121212', width=2, fill='#f0c020')
draw.text((200, 545), "RULE: Data transfer can only begin after ACK step completes.", fill='#121212')

img.save('/home/nikhil/EduFlash/test_diagram.png', 'PNG')
print("Successfully generated /home/nikhil/EduFlash/test_diagram.png")
