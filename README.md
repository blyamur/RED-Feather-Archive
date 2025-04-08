# RED-Feather-Archive
RED Feather Archive - Organize. Tag. Find (Mini-catalog) Local DB on Python Flask 

Catalog, database, media library for your files. You can specify a directory, add a list of files to the database, add tags to them and get access to documents or photos will be easier. For example, you can use it as a photo stock, for a quick search for the desired image or as a library of documents, you can also use it as a media library of your films, adding descriptions and keywords to the records in the database.

When adding video files to the database, a frame from the video is placed as a preview, which can then be changed (random selection).

Use at your own risk. Be careful, there are two options for deleting files, in one case only the entry in the database is deleted, in the other the file is completely deleted from the system.

![Light screenshot](https://github.com/blyamur/RED-Feather-Archive/blob/main/screen.jpg)
![Light screenshot](https://github.com/blyamur/RED-Feather-Archive/blob/main/screen_2.jpg)

#### Features:
*  Dark and light themes with switching
*  The script is available in two languages: Russian and English
*  Switch languages ​​on the fly without restarting the script
*  By default, blurring of all previews is enabled, you can disable it during work
*  Opening the script page in the browser via the tray icon
*  You can open files directly from the gallery
*  For convenience, you can copy files from their location to a convenient place
*  When adding files to the database, the full path to the file in the system is specified
*  The file name in the database is taken from the original file name, in the editing mode you can change it to your own for convenience
*  Database optimization function to speed up work
*  Database check function, with cleaning of deleted files from the system and creation of lost previews
*  Full database cleanup function
*  Display database statistics, size, number of added files
*  The file name, full path, size, date added and tags are written to the database.
*  Display top 25 tags on the main page
*  On the editing page, you can select files in bulk and delete them from the database and completely from the system
*  You can add and edit tags to files added to the database
*  automatic splitting of tags pasted from the clipboard in the format tag1,tag2
*  Search is available both by file name and by tags
*  For example, the first tag is the file extension tag.


#### Supported file formats:
```
Images  '.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff', '.webp',
Video '.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.mpeg',
Documents '.pdf', '.doc', '.docx', '.xls', '.xlsx'
```

#### How to start:

To run a Python script, simply download the archive and unzip it to a folder convenient for you.

Next, you will need to install the necessary libraries, this can be done with one command.

```
pip install -r requirements.txt
```
Also, to work with PDF, you need to download the latest release of [Poppler Packaged for Windows](https://github.com/oschwartz10612/poppler-windows) and unpack folders `Library` and `share` it into the already created `poppler` directory. Not necessary unless you plan to work with PDF format, such as adding PDF files to the database.

Once all preparations are complete, it is enough to run the `index.py` file

After launch, the service is available at:
```
http://127.0.0.1:5555/
```
If necessary, the port can be changed to any other in the `index.py` file
```
webbrowser.open("http://127.0.0.1:5555")
```
```
app.run(port=5555, threaded=True)
```
The necessary files and folders will be created automatically on first run, such as the preview folder and the database file.



## Links | Ссылки 
 [Poppler Packaged for Windows](https://github.com/oschwartz10612/poppler-windows)
 
 [Poppler Packaged for Windows Releases](https://github.com/oschwartz10612/poppler-windows/releases)
 
 [README на Русском языке]( https://github.com/blyamur/RED-Feather-Archive/blob/main/README_RUS.md)
 

##  Terms and conditions | Условия

License: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

Not for commercial use. \ Не для коммерческого использования.



### Did you find this useful?! | Вы нашли это  полезным ?!

Happy to hear that :) If you want to thank me for helping you, you can treat me to a cup of coffee  :coffee: ([yoomoney](https://yoomoney.ru/to/41001158104834) or [ko-fi](https://ko-fi.com/monseg)) 

*Рад это слышать :) Если вы хотите меня отблагодарить помочь, вы можете угостить меня чашечкой кофе*
  
© 2025 From Russia with ❤ 
