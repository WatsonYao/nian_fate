##### JSON MESSAGE 

module | action |desc | content | version | 备注  
---|---|---|---|---|---|
sys | info  | e.g "pc-web"|- |-| 设备信息 | 
dream | list  | "" | dreamList |-|所有记本|
step | list  | dreamId | stepList |-|所有进展|
step | update  | stepId|"update content" | -|进展内容更新|-|
step|  add  | dreamId | -|-|进展新增回执|-|
step|  search  | keyword | -|-|进展新增回执|

##### 使用说明 
0. 手机和电脑必须在同一个 WIFI 环境下。
1. 打开手机客户端的主机模式，留意主机地址和端口号  。
2. 打开桌面客户端，左下角输入主机的地址和端口号。
3. 点击「连接到 nian」，正常连接后，手机端和桌面端都会显示连接成功。
4. 连接成功后，就可以在记本/进展上点选查看和编辑了。
5. 选择旧进展编辑后「更新」，会同步更新到nian。
6. 选择「新增」，则列表中会新增一项，点选后即可编辑。

###### npm
npm start 运行项目  
npm run package 打包成一个目录到out目录下，注意这种打包一般用于调试，并不是用于分发。  
npm run make 打出真正的分发包，放在out\make目录下。
