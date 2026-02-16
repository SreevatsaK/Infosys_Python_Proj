file = open(r"D:\Infosys\text.txt", "r")
lines = file.readlines()
file.close()

for i in range(10):
    start = i * 10
    end = start + 10
    
    chunk = lines[start:end]
   
    new_file = open("chunk" + str(i+1) + ".txt", "w")
    new_file.writelines(chunk)
    new_file.close()

print("Files created successfully!")

