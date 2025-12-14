const chartOrderExamples = {

    order_flowchart: `graph TD
    Start[用户下单] --> A[订单创建]
    A --> B{库存检查}
    B -- 有货 --> C[扣减库存]
    B -- 缺货 --> D[通知用户缺货]
    D --> E[等待补货/取消订单]
    E --> F[订单取消]
    
    C --> G[订单支付]
    G --> H{支付状态}
    H -- 支付成功 --> I[订单确认]
    H -- 支付失败 --> J[取消订单]
    
    I --> K[订单打包]
    K --> L[订单发货]
    L --> M{物流类型}
    M -- 快递 --> N[快递配送]
    M -- 自提 --> O[等待用户自提]
    
    N --> P[运输中]
    P --> Q{配送状态}
    Q -- 派送成功 --> R[确认收货]
    Q -- 派送异常 --> S[异常处理]
    
    O --> T[用户提货]
    T --> U[提货确认]
    
    R --> V[订单完成]
    U --> V
    
    S --> W[重新派送/退款]
    W --> X[流程结束]
    F --> X
    J --> X
    V --> X
    
    subgraph 用户侧
        Start
        D
        R
        T
    end
    
    subgraph 系统侧
        A
        B
        C
        G
        H
        I
    end
    
    subgraph 仓库侧
        K
        L
    end
    
    subgraph 物流侧
        N
        P
        Q
        S
    end
    
    style Start fill:#e1f5fe
    style V fill:#c8e6c9
    style S fill:#ffebee
    style F fill:#ffebee
    style J fill:#ffebee`,

    order_sequence: `sequenceDiagram
    title 订单完整流转流程：从下单到收货
    participant C as 用户/客户端
    participant F as 前端
    participant G as API网关
    participant O as 订单服务
    participant P as 支付服务
    participant I as 库存服务
    participant W as 仓库服务
    participant L as 物流服务
    participant S as 短信/消息服务
    participant DB as 数据库
    participant R as 缓存(Redis)
    participant MQ as 消息队列

    Note over C,W: 第一阶段：下单与库存锁定
    
    C->>F: 1. 提交订单
    F->>G: 2. POST /api/orders
    G->>O: 3. 创建订单请求
    
    O->>R: 4. 分布式锁<br>order_lock:{userId}
    R-->>O: 5. 获取锁成功
    
    O->>DB: 6. 创建订单记录<br>status: PENDING
    DB-->>O: 7. 订单ID: 12345
    
    par 并行处理
        O->>I: 8. 预扣库存
        I->>DB: 9. 锁定库存
        DB-->>I: 10. 锁定成功
        I-->>O: 11. 库存锁定结果
    and
        O->>MQ: 12. 发送订单创建事件
    end
    
    O->>R: 13. 写入订单缓存<br>order:12345
    O->>R: 14. 释放分布式锁
    O-->>G: 15. 返回订单信息
    G-->>F: 16. 返回订单号
    F-->>C: 17. 订单创建成功
    
    Note over C,W: 第二阶段：支付流程
    
    C->>F: 18. 选择支付方式
    F->>G: 19. POST /api/payments
    G->>P: 20. 发起支付
    
    P->>P: 21. 生成支付流水
    P->>DB: 22. 记录支付信息
    P-->>G: 23. 返回支付参数
    
    G-->>F: 24. 跳转支付页面/二维码
    F-->>C: 25. 显示支付界面
    
    Note over C,W: 支付网关回调 (异步)
    rect rgb(240, 240, 255)
        Note over P,O: 支付成功回调
        P->>P: 26. 验证支付结果
        P->>DB: 27. 更新支付状态
        P->>O: 28. 通知订单支付成功
        
        O->>DB: 29. 更新订单状态<br>status: PAID
        O->>R: 30. 更新缓存状态
        
        par 并行处理
            O->>W: 31. 通知仓库备货
            O->>S: 32. 发送支付成功短信
        end
        
        O->>MQ: 33. 发送订单已支付事件
    end
    
    F->>G: 34. 轮询支付状态
    G->>P: 35. 查询支付结果
    P-->>G: 36. 支付成功
    G-->>F: 37. 支付完成
    F-->>C: 38. 支付成功提示
    
    Note over C,W: 第三阶段：仓库处理与发货
    
    W->>W: 39. 订单拣货
    W->>W: 40. 订单打包
    W->>DB: 41. 更新库存(实际出库)
    
    W->>L: 42. 创建物流单
    L->>L: 43. 分配快递员
    L-->>W: 44. 返回运单号
    
    W->>DB: 45. 更新订单状态<br>status: SHIPPED
    W->>O: 46. 通知已发货
    O->>R: 47. 更新缓存状态
    
    par 通知用户
        O->>S: 48. 发送发货短信
        O->>MQ: 49. 发送订单已发货事件
    end
    
    Note over C,W: 第四阶段：物流配送
    
    L->>L: 50. 快递员取件
    L->>L: 51. 运输中
    L->>L: 52. 到达配送站
    L->>L: 53. 快递员派送
    
    rect rgb(240, 255, 240)
        Note over L,O: 物流状态更新 (实时)
        L->>MQ: 54. 推送物流轨迹
        MQ->>O: 55. 消费物流更新
        O->>DB: 56. 记录物流轨迹
        O->>R: 57. 更新物流缓存
    end
    
    Note over C,W: 第五阶段：用户收货
    
    C->>F: 58. 确认收货
    F->>G: 59. POST /api/orders/12345/receive
    G->>O: 60. 确认收货请求
    
    O->>DB: 61. 更新订单状态<br>status: COMPLETED
    O->>R: 62. 更新缓存状态
    O->>I: 63. 扣减库存(最终)
    O->>S: 64. 发送收货确认短信
    
    par 异步处理
        O->>MQ: 65. 发送订单完成事件
        O->>MQ: 66. 发送评价邀请
        O->>MQ: 67. 发送结算通知
    end
    
    O-->>G: 68. 收货成功
    G-->>F: 69. 操作成功
    F-->>C: 70. 收货完成
    
    Note over C,W: 第六阶段：订单完成后续
    
    rect rgb(255, 240, 240)
        Note over O: 异步任务执行
        MQ->>MQ: 71. 触发自动评价(7天后)
        MQ->>MQ: 72. 触发财务结算
        MQ->>MQ: 73. 触发数据归档
    end`,

    order_state: `stateDiagram-v2
    [*] --> 草稿状态
    
    草稿状态 --> 待付款: 用户提交订单
    草稿状态 --> 已取消: 用户放弃
    
    state 待付款 {
        [*] --> 创建成功
        创建成功 --> 支付中: 发起支付
        支付中 --> 支付成功
        支付中 --> 支付失败
        支付成功 --> [*]
        支付失败 --> 重试支付
        重试支付 --> 支付中
    }
    
    待付款 --> 已取消: 用户取消/超时取消
    待付款 --> 已支付: 支付成功
    
    state 已支付 {
        [*] --> 支付验证
        支付验证 --> 待确认: 验证通过
        支付验证 --> 风控审核: 可疑交易
        风控审核 --> 待确认: 审核通过
        风控审核 --> 已取消: 审核拒绝
        待确认 --> [*]
    }
    
    已支付 --> 已确认: 系统自动确认
    已支付 --> 已取消: 风控拒绝
    
    已确认 --> 配货中: 开始履约
    已确认 --> 已取消: 用户申请取消(审核)
    
    state 配货中 {
        [*] --> 拣货中
        拣货中 --> 打包中: 拣货完成
        打包中 --> 待出库: 打包完成
        待出库 --> [*]
    }
    
    配货中 --> 已发货: 物流揽收
    配货中 --> 库存不足: 缺货
    库存不足 --> 配货中: 补货完成
    库存不足 --> 已取消: 无法补货
    
    已发货 --> 运输中: 在途运输
    已发货 --> 物流异常: 物流问题
    
    运输中 --> 派送中: 到达目的地
    运输中 --> 运输异常: 中转异常
    
    派送中 --> 已签收: 成功交付
    派送中 --> 派送失败: 无法交付
    
    派送失败 --> 待自提: 转自提点
    派送失败 --> 退货中: 客户拒收
    
    待自提 --> 已签收: 客户提取
    待自提 --> 退货中: 超时未取
    
    已签收 --> 已完成: 确认收货
    已签收 --> 退货中: 申请退货
    
    state 售后流程 {
        [*] --> 退货申请
        退货申请 --> 退货审核
        退货审核 --> 待退货: 审核通过
        退货审核 --> 已拒绝: 审核拒绝
        待退货 --> 退货中: 用户寄回
        退货中 --> 待退款: 仓库收货
        待退款 --> 退款完成
        退款完成 --> [*]
        已拒绝 --> [*]
    }
    
    退货中 --> 售后流程
    售后流程 --> 已取消: 退款完成
    售后流程 --> 已完成: 退货取消
    
    已完成 --> [*]
    已取消 --> [*]
    
    %% 定义状态样式
    classDef normalState fill:#e1f5fe,stroke:#01579b
    classDef successState fill:#c8e6c9,stroke:#2e7d32
    classDef errorState fill:#ffebee,stroke:#c62828
    classDef warningState fill:#fff3e0,stroke:#ef6c00
    classDef endState fill:#f3e5f5,stroke:#7b1fa2`,
    
    api_sequence: `sequenceDiagram
    participant Client as 客户端
    participant Gateway as API网关
    participant Auth as 认证
    participant OrderAPI as 订单API
    participant Cache as 缓存
    participant DB as 数据库

    Client->>Gateway: 1. GET /orders/123
    Gateway->>Auth: 2. 验证权限
    Auth-->>Gateway: 3. 验证通过
    Gateway->>OrderAPI: 4. 转发请求
    
    OrderAPI->>Cache: 5. 查缓存
    alt 缓存存在
        Cache-->>OrderAPI: 6. 返回数据
    else 缓存不存在
        Cache-->>OrderAPI: 6. 返回null
        OrderAPI->>DB: 7. 查数据库
        DB-->>OrderAPI: 8. 订单数据
        OrderAPI->>Cache: 9. 写缓存
    end
    
    OrderAPI-->>Gateway: 10. 响应数据
    Gateway-->>Client: 11. 返回结果`,

    order_er: `erDiagram
    %% ========== 用户模块 ==========
    USER {
        bigint id PK "用户ID"
        varchar username "用户名"
        varchar phone "手机号"
        varchar email "邮箱"
        varchar password_hash "密码哈希"
        int user_type "用户类型: 1-普通用户, 2-商家用户"
        varchar avatar_url "头像"
        decimal balance "账户余额"
        int status "状态: 0-禁用, 1-正常"
        datetime created_at "创建时间"
        datetime updated_at "更新时间"
    }
    
    USER_ADDRESS {
        bigint id PK "地址ID"
        bigint user_id FK "用户ID"
        varchar consignee "收货人"
        varchar phone "收货电话"
        varchar province "省份"
        varchar city "城市"
        varchar district "区县"
        varchar detail "详细地址"
        varchar postal_code "邮编"
        tinyint is_default "是否默认地址"
        datetime created_at "创建时间"
    }
    
    USER_CART {
        bigint id PK "购物车ID"
        bigint user_id FK "用户ID"
        bigint sku_id FK "SKU ID"
        int quantity "数量"
        datetime created_at "创建时间"
        datetime updated_at "更新时间"
    }
    
    USER_COUPON {
        bigint id PK "用户优惠券ID"
        bigint user_id FK "用户ID"
        bigint coupon_id FK "优惠券ID"
        int status "状态: 0-未使用, 1-已使用, 2-已过期"
        datetime used_at "使用时间"
        datetime expire_at "过期时间"
        datetime created_at "领取时间"
    }
    
    %% ========== 商品模块 ==========
    PRODUCT {
        bigint id PK "商品ID"
        bigint shop_id FK "店铺ID"
        varchar product_name "商品名称"
        varchar product_code "商品编码"
        bigint category_id FK "分类ID"
        varchar main_image "主图"
        text description "描述"
        decimal price "价格"
        decimal market_price "市场价"
        int stock "库存"
        int status "状态: 0-下架, 1-上架"
        int sales_count "销量"
        datetime created_at "创建时间"
        datetime updated_at "更新时间"
    }
    
    PRODUCT_SKU {
        bigint id PK "SKU ID"
        bigint product_id FK "商品ID"
        varchar sku_code "SKU编码"
        json specifications "规格属性"
        decimal price "价格"
        decimal market_price "市场价"
        int stock "库存"
        varchar sku_image "SKU图片"
        int status "状态"
        datetime created_at "创建时间"
    }
    
    PRODUCT_CATEGORY {
        bigint id PK "分类ID"
        varchar category_name "分类名称"
        bigint parent_id FK "父分类ID"
        int level "层级"
        int sort_order "排序"
        varchar icon "图标"
        int status "状态"
    }
    
    PRODUCT_BRAND {
        bigint id PK "品牌ID"
        varchar brand_name "品牌名称"
        varchar logo "品牌logo"
        varchar description "品牌描述"
        int status "状态"
    }
    
    %% ========== 商家模块 ==========
    SHOP {
        bigint id PK "店铺ID"
        varchar shop_name "店铺名称"
        bigint user_id FK "店主用户ID"
        varchar shop_logo "店铺logo"
        varchar description "店铺描述"
        varchar business_license "营业执照"
        varchar contact_phone "联系电话"
        varchar contact_email "联系邮箱"
        varchar province "省份"
        varchar city "城市"
        varchar address "地址"
        decimal credit_score "信用分"
        int status "状态: 0-关闭, 1-正常, 2-审核中"
        datetime created_at "创建时间"
        datetime updated_at "更新时间"
    }
    
    SHOP_STAFF {
        bigint id PK "员工ID"
        bigint shop_id FK "店铺ID"
        bigint user_id FK "用户ID"
        varchar staff_name "员工姓名"
        varchar position "职位"
        json permissions "权限列表"
        int status "状态"
        datetime created_at "创建时间"
    }
    
    %% ========== 订单模块 ==========
    ORDER {
        bigint id PK "订单ID"
        varchar order_no UK "订单号"
        bigint user_id FK "用户ID"
        bigint shop_id FK "店铺ID"
        decimal total_amount "订单总金额"
        decimal discount_amount "优惠金额"
        decimal shipping_fee "运费"
        decimal payable_amount "应付金额"
        decimal paid_amount "实付金额"
        int order_status "订单状态"
        int payment_status "支付状态"
        bigint address_id FK "收货地址ID"
        varchar buyer_remark "买家备注"
        varchar seller_remark "卖家备注"
        datetime pay_time "支付时间"
        datetime deliver_time "发货时间"
        datetime receive_time "收货时间"
        datetime cancel_time "取消时间"
        datetime created_at "创建时间"
        datetime updated_at "更新时间"
    }
    
    ORDER_ITEM {
        bigint id PK "订单项ID"
        bigint order_id FK "订单ID"
        bigint product_id FK "商品ID"
        bigint sku_id FK "SKU ID"
        varchar product_name "商品名称"
        json specifications "规格"
        decimal price "单价"
        int quantity "数量"
        decimal total_price "总价"
        varchar item_image "商品图片"
    }
    
    ORDER_PAYMENT {
        bigint id PK "支付ID"
        bigint order_id FK "订单ID"
        varchar payment_no "支付流水号"
        varchar payment_method "支付方式"
        decimal payment_amount "支付金额"
        int payment_status "支付状态"
        datetime pay_time "支付时间"
        varchar transaction_id "第三方交易号"
        json payment_data "支付数据"
        datetime created_at "创建时间"
    }
    
    ORDER_REFUND {
        bigint id PK "退款ID"
        bigint order_id FK "订单ID"
        varchar refund_no "退款单号"
        decimal refund_amount "退款金额"
        int refund_type "退款类型"
        int refund_status "退款状态"
        text refund_reason "退款原因"
        text reject_reason "拒绝原因"
        datetime apply_time "申请时间"
        datetime process_time "处理时间"
        datetime complete_time "完成时间"
    }
    
    %% ========== 物流模块 ==========
    LOGISTICS {
        bigint id PK "物流ID"
        bigint order_id FK "订单ID"
        varchar logistics_no "物流单号"
        varchar logistics_company "物流公司"
        varchar shipper_name "发货人"
        varchar shipper_phone "发货电话"
        varchar receiver_name "收货人"
        varchar receiver_phone "收货电话"
        varchar receiver_address "收货地址"
        int logistics_status "物流状态"
        datetime shipped_time "发货时间"
        datetime received_time "签收时间"
        json tracking_info "物流轨迹"
    }
    
    WAREHOUSE {
        bigint id PK "仓库ID"
        bigint shop_id FK "店铺ID"
        varchar warehouse_name "仓库名称"
        varchar warehouse_code "仓库编码"
        varchar province "省份"
        varchar city "城市"
        varchar address "详细地址"
        varchar contact_person "联系人"
        varchar contact_phone "联系电话"
        int status "状态"
        datetime created_at "创建时间"
    }
    
    INVENTORY {
        bigint id PK "库存ID"
        bigint warehouse_id FK "仓库ID"
        bigint product_id FK "商品ID"
        bigint sku_id FK "SKU ID"
        int total_quantity "总数量"
        int available_quantity "可用数量"
        int locked_quantity "锁定数量"
        datetime updated_at "更新时间"
    }
    
    %% ========== 营销模块 ==========
    COUPON {
        bigint id PK "优惠券ID"
        varchar coupon_name "优惠券名称"
        int coupon_type "优惠类型"
        decimal discount_amount "优惠金额"
        decimal min_purchase "最低消费"
        datetime valid_from "有效期开始"
        datetime valid_to "有效期结束"
        int total_quantity "发行总量"
        int used_quantity "已使用量"
        int status "状态"
        datetime created_at "创建时间"
    }
    
    ACTIVITY {
        bigint id PK "活动ID"
        varchar activity_name "活动名称"
        int activity_type "活动类型"
        datetime start_time "开始时间"
        datetime end_time "结束时间"
        json activity_rules "活动规则"
        int status "状态"
        datetime created_at "创建时间"
    }
    
    %% ========== 关系定义 ==========
    
    USER ||--o{ USER_ADDRESS : has
    USER ||--o{ USER_CART : has
    USER ||--o{ USER_COUPON : owns
    USER ||--o{ ORDER : places
    
    USER ||--|| SHOP : operates
    USER ||--o{ SHOP_STAFF : employs
    
    SHOP ||--o{ PRODUCT : sells
    SHOP ||--o{ WAREHOUSE : owns
    
    PRODUCT ||--o{ PRODUCT_SKU : has
    PRODUCT ||--|| PRODUCT_CATEGORY : belongs_to
    PRODUCT ||--|| PRODUCT_BRAND : belongs_to
    PRODUCT_CATEGORY ||--o{ PRODUCT_CATEGORY : has_children
    
    ORDER ||--o{ ORDER_ITEM : contains
    ORDER ||--o{ ORDER_PAYMENT : has
    ORDER ||--o{ ORDER_REFUND : may_have
    ORDER ||--|| LOGISTICS : has
    ORDER ||--|| USER_ADDRESS : uses
    
    LOGISTICS ||--|| WAREHOUSE : ships_from
    
    WAREHOUSE ||--o{ INVENTORY : manages
    PRODUCT_SKU ||--o{ INVENTORY : stored_in
    
    PRODUCT_SKU ||--o{ ORDER_ITEM : appears_in
    PRODUCT_SKU ||--o{ USER_CART : added_to
    
    COUPON ||--o{ USER_COUPON : distributed_as
    COUPON ||--o{ ORDER : applied_to
    
    ACTIVITY ||--o{ PRODUCT : includes`,

    order_pie: `pie
    title 2024年商品类目销售占比
    "数码电子" : 120000
    "服饰鞋包" : 85000
    "美妆护肤" : 78000
    "家居用品" : 65000
    "食品饮料" : 52000
    "图书文具" : 35000
    "运动户外" : 42000`,

    order_class: `classDiagram
    User "1" -- "*" Order : 创建
    Order "1" -- "*" OrderItem : 包含
    OrderItem "*" -- "1" Product : 对应
    Order "1" -- "1" Payment : 支付
    Order "1" -- "1" Address : 收货
    
    class User {
        +id: Long
        +name: String
        +email: String
        +createOrder(): Order
    }
    
    class Order {
        +id: Long
        +orderNo: String
        +status: String
        +total: BigDecimal
        +place(): Boolean
        +cancel(): Boolean
    }
    
    class Product {
        +id: Long
        +name: String
        +price: BigDecimal
        +stock: Integer
        -reduceStock(): Boolean
    }
    
    class OrderItem {
        +id: Long
        +quantity: Integer
        +price: BigDecimal
        +subtotal(): BigDecimal
    }
    
    class Payment {
        +id: Long
        +amount: BigDecimal
        +method: String
        +process(): Boolean
    }
    
    class Address {
        +id: Long
        +consignee: String
        +phone: String
        +fullAddress: String
    }`,

    "order_journey": `journey
    title 电商购物用户旅程图
    section 发现阶段
      浏览商品: 5: 用户
      搜索商品: 4: 用户
      查看推荐: 3: 用户
      收藏商品: 2: 用户
    
    section 决策阶段
      查看详情: 5: 用户
      比较价格: 4: 用户
      阅读评价: 5: 用户
      咨询客服: 3: 用户
      加入购物车: 4: 用户
    
    section 购买阶段
      进入结算: 5: 用户
      选择地址: 4: 用户
      选择支付: 5: 用户
      确认订单: 4: 用户
      完成支付: 5: 用户
    
    section 履约阶段
      等待发货: 3: 用户
      查看物流: 4: 用户
      接收包裹: 5: 用户
      确认收货: 4: 用户
    
    section 售后阶段
      评价商品: 3: 用户
      申请售后: 2: 用户
      分享推荐: 1: 用户`,

    order_gantt: `gantt
    title 完整电商项目综合时间线
    dateFormat  YYYY-MM-DD
    axisFormat  %Y-%m
    
    section 第一阶段：基础平台
    技术选型          :done,    p1, 2024-01-01, 10d
    架构搭建          :done,    p2, after p1, 20d
    用户系统          :done,    p3, after p2, 15d
    商品系统          :done,    p4, after p3, 20d
    
    section 第二阶段：核心交易
    购物车功能        :active,  p5, 2024-03-01, 15d
    订单系统          :crit,    p6, after p5, 25d
    支付对接          :         p7, after p6, 20d
    库存管理          :         p8, after p7, 15d
    
    section 第三阶段：运营能力
    营销工具          :         p9, 2024-05-15, 20d
    数据分析平台      :         p10, after p9, 25d
    客服系统          :         p11, after p10, 15d
    物流对接          :         p12, after p11, 20d
    
    section 第四阶段：优化扩展
    移动端优化        :         p13, 2024-08-01, 20d
    性能优化          :         p14, after p13, 15d
    安全加固          :         p15, after p14, 10d
    第三方接入        :         p16, after p15, 15d
    
    section 第五阶段：上线运营
    内测公测          :         p17, 2024-10-01, 30d
    正式上线          :milestone, p18, 2024-11-01, 0d
    运营推广          :         p19, after p18, 60d`,

}