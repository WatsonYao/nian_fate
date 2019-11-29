####JSON MESSAGE

module | action | content | desc
------------ | ------------- | ------------ | ------------
sys | info  | e.g "pc-web" | 设备信息
dream_list | info  | "" | 所有记本
dream_detail | info  | "dreamId" | 记本下所有进展
step_update | stepId  | "update content" | 进展内容更新
step_add | dreamId  | "new content" | 进展内容更新
img | info  | image array | 图片

####
#####使用说明
0. 手机和电脑必须在同一个 WIFI 环境下
1. 打开手机客户端的主机模式，留意主机地址和端口号  
2. 打开桌面客户端，下方卡片上输入主机的地址和端口号
3. 点击「连接到 nian」，正常连接后，手机端和桌面端都会显示连接成功。
4. 连接成功后，就可以在文本框内输入文字了
5. 点击「更新」 即可将文本内容发送到手机端
