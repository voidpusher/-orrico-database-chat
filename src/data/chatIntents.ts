export interface IntentDefinition {
  id: string;
  label: string;
  patterns: string[];
  examples: string[];
  response: string;
  followUp: string;
}

export const CHAT_INTENTS: IntentDefinition[] = [
  {
    id: "sales_yesterday",
    label: "sales",
    patterns: ["sales yesterday", "revenue yesterday", "yesterday sale"],
    examples: [
      "What were my sales yesterday?",
      "How much revenue did I make yesterday?",
      "Show yesterday's sales summary",
      "Tell me yesterday's store revenue",
      "How many orders came in yesterday?",
      "Was yesterday better than usual?",
      "Give me yesterday's business performance",
      "What did I sell yesterday?",
    ],
    response:
      "Yesterday you recorded Rs 2,84,750 in sales from 43 orders. That is 12% higher than the same day last week, with power banks and mid-range smartphones driving the strongest revenue.",
    followUp:
      "If you want, I can break that down by product, hour, or payment method.",
  },
  {
    id: "sales_today",
    label: "sales",
    patterns: ["sales today", "today sales", "today revenue", "revenue today"],
    examples: [
      "What are my sales today?",
      "How much have I sold today?",
      "Show me today's revenue",
      "How is business doing today?",
      "Give me today's order count",
      "What's today's store performance?",
      "How many sales have we made today?",
      "Tell me today's sales summary",
    ],
    response:
      "So far today, your store has generated Rs 1,96,400 from 29 orders. Mobile accessories are leading volume, and your strongest sales hour has been 1 PM to 2 PM.",
    followUp:
      "I can also compare today with yesterday or show which categories are pushing today's numbers.",
  },
  {
    id: "weekly_sales",
    label: "sales",
    patterns: ["sales this week", "weekly sales", "revenue this week"],
    examples: [
      "How are my sales this week?",
      "Show weekly sales",
      "What is this week's revenue?",
      "How much have I sold this week?",
      "Give me the weekly business summary",
      "Are we ahead this week?",
      "What are my weekly orders and revenue?",
      "Tell me this week's performance",
    ],
    response:
      "This week you are at Rs 12,48,900 in sales across 214 orders. That puts you 9% ahead of last week, with accessories and audio devices contributing the most growth.",
    followUp:
      "I can also tell you which products or customers are behind that weekly growth.",
  },
  {
    id: "monthly_comparison",
    label: "comparison",
    patterns: ["compare this month", "month to month", "this month to last month", "monthly comparison"],
    examples: [
      "Compare this month to last month",
      "How am I doing versus last month?",
      "Show month over month performance",
      "What changed this month compared to last month?",
      "Give me a monthly comparison",
      "Are sales better than last month?",
      "Tell me the month-to-month trend",
      "What is my MoM business performance?",
    ],
    response:
      "Compared with last month, sales are up 18%, orders are up 22%, and new customers are up 31%. Average order value is down slightly by 3%, which suggests more accessory-led purchases.",
    followUp:
      "Want me to pinpoint what changed most between the two months?",
  },
  {
    id: "top_products",
    label: "products",
    patterns: ["top products", "best products", "best selling products", "top 5 products"],
    examples: [
      "Show me my top products",
      "What are the best selling products?",
      "Which items are selling the most?",
      "Give me the top 5 products this week",
      "What products are driving revenue?",
      "Which products are my winners?",
      "Tell me my top selling SKUs",
      "What are the highest performing products?",
    ],
    response:
      "Your top 5 products this week are Xiaomi Power Bank 20000mAh, Realme Buds Air 3 TWS Earbuds, Logitech K380 Wireless Keyboard, Samsung Galaxy A34 5G, and Samsung 43-inch Smart LED TV. Xiaomi leads unit volume, while Samsung leads revenue.",
    followUp:
      "I can also sort the list by units sold, revenue, or margin.",
  },
  {
    id: "top_categories",
    label: "products",
    patterns: ["top category", "best category", "which category", "product category performance"],
    examples: [
      "Which category performs best?",
      "Show my top categories",
      "What category is strongest?",
      "Which product category makes the most money?",
      "Give me category performance",
      "What are my best categories this month?",
      "Which category sells the most?",
      "Tell me category-wise performance",
    ],
    response:
      "Your strongest category this month is mobile accessories, contributing 28% of total unit sales and 45% margin. Audio devices are second, while televisions lead premium-ticket revenue.",
    followUp:
      "If you want, I can compare category performance by sales, margin, or stock risk.",
  },
  {
    id: "inventory_status",
    label: "inventory",
    patterns: ["inventory", "stock status", "inventory looking", "stock levels"],
    examples: [
      "How is inventory looking?",
      "Show me inventory status",
      "What is my stock situation?",
      "Give me an inventory summary",
      "How healthy is my stock?",
      "Tell me current stock levels",
      "Do I have enough inventory?",
      "What does inventory look like right now?",
    ],
    response:
      "Inventory looks healthy overall, but Lenovo IdeaPad Slim 3, Samsung 43-inch Smart LED TV, HP LaserJet M126nw Printer, and Samsung Galaxy A34 5G are all running low. Power banks, earbuds, and headphones are well stocked.",
    followUp:
      "I can also show restock priority or tell you which SKUs are overstocked.",
  },
  {
    id: "low_stock",
    label: "inventory",
    patterns: ["low stock", "running low", "restock soon", "stock alert"],
    examples: [
      "Which items are low on stock?",
      "Show low stock alerts",
      "What products are running low?",
      "Which SKUs need restocking?",
      "Tell me my low inventory items",
      "What is close to low stock?",
      "Do I have any stock alerts?",
      "Which products need attention soon?",
    ],
    response:
      "Your most urgent low-stock items are Lenovo IdeaPad Slim 3 with 6 units left, Samsung 43-inch Smart LED TV with 8, HP LaserJet M126nw Printer with 11, and Samsung Galaxy A34 5G with 12. I would prioritize laptops and TVs first because they are high-value movers.",
    followUp:
      "I can turn that into a reorder plan if you want.",
  },
  {
    id: "out_of_stock_risk",
    label: "inventory",
    patterns: ["out of stock", "stockout", "will run out", "stock out risk"],
    examples: [
      "Which items may go out of stock?",
      "What products are at stockout risk?",
      "Will anything run out soon?",
      "Show out of stock risk",
      "Which SKUs might stock out this week?",
      "What inventory is most at risk?",
      "Tell me likely stockouts",
      "Which fast movers may run out?",
    ],
    response:
      "At current sales velocity, Lenovo IdeaPad Slim 3 may stock out in 3 days, Samsung 43-inch Smart LED TV in 4 days, and Samsung Galaxy A34 5G within the week. Those are your highest stockout risks right now.",
    followUp:
      "I can also estimate how much you should reorder to avoid losing sales.",
  },
  {
    id: "reorder_suggestions",
    label: "inventory",
    patterns: ["reorder", "purchase order", "what should i buy", "restock recommendations"],
    examples: [
      "What should I reorder?",
      "Give me restock recommendations",
      "What items should I buy again?",
      "Create a reorder list",
      "What needs to be restocked first?",
      "Suggest my next purchase order",
      "Which products should I reorder now?",
      "What do I need to stock up on?",
    ],
    response:
      "Recommended reorder list: 20 Lenovo IdeaPad Slim 3 units, 15 Samsung 43-inch Smart LED TVs, 25 Samsung Galaxy A34 5G phones, and 18 HP LaserJet M126nw Printers. That would cover projected demand for the next two weeks with a safe buffer.",
    followUp:
      "If you want, I can narrow that down to only fast-moving or high-margin items.",
  },
  {
    id: "profit_margin",
    label: "profit",
    patterns: ["profit margin", "margin", "gross margin", "profit analysis"],
    examples: [
      "What is my profit margin?",
      "Show me margin analysis",
      "How profitable is the store?",
      "Give me gross margin",
      "What are my current margins?",
      "How good is my profit performance?",
      "Tell me margin by category",
      "What does profit look like right now?",
    ],
    response:
      "Your current overall gross margin is 32.8%. Mobile accessories are strongest at 45%, audio devices are at 38%, computer accessories at 35%, and premium hardware like laptops and TVs are lower at 24% but still important for revenue.",
    followUp:
      "I can also show where margin is leaking or which items deserve a pricing change.",
  },
  {
    id: "highest_profit_products",
    label: "profit",
    patterns: ["most profitable", "highest profit", "high margin products", "best margin products"],
    examples: [
      "Which products are most profitable?",
      "Show high margin products",
      "What are my best margin items?",
      "Which products make the most profit?",
      "Give me top profitable SKUs",
      "What should I push for better margin?",
      "Which items are highest profit?",
      "Tell me my strongest profit products",
    ],
    response:
      "Your most profitable products right now are premium phone accessories, wireless earbuds, and branded chargers. They move quickly, require less capital than large electronics, and consistently deliver margins above 40%.",
    followUp:
      "I can recommend bundles or promotions around those high-margin products too.",
  },
  {
    id: "top_customers",
    label: "customers",
    patterns: ["top customers", "best customers", "highest spending customers", "top client"],
    examples: [
      "Who are my top customers?",
      "Show highest spending customers",
      "Which customers buy the most?",
      "Give me my best customers",
      "Who spends the most in my store?",
      "Tell me top buyers this month",
      "Who are my VIP customers?",
      "Which customers generate most revenue?",
    ],
    response:
      "Your top customers this month are Amit Kumar, Rajesh Electronics, Priya Patel, Vikash Singh, and Sneha Gupta. Amit Kumar leads both order count and total spend with Rs 1,87,450 across 18 orders.",
    followUp:
      "Want me to separate high-frequency buyers from high-value buyers?",
  },
  {
    id: "repeat_customers",
    label: "customers",
    patterns: ["repeat customers", "returning customers", "loyal customers", "repeat buyers"],
    examples: [
      "How many repeat customers do I have?",
      "Show returning customer performance",
      "Are loyal customers buying more?",
      "Tell me about repeat buyers",
      "What is my customer retention like?",
      "How strong are repeat sales?",
      "Do I have good returning customers?",
      "Give me repeat customer analysis",
    ],
    response:
      "Repeat customers account for 41% of this month's orders and 54% of total revenue. That is a strong retention signal, especially in accessories and audio device categories.",
    followUp:
      "I can also point out what your loyal customers buy most often.",
  },
  {
    id: "inactive_customers",
    label: "customers",
    patterns: ["inactive customers", "customers not visited", "lost customers", "dormant customers"],
    examples: [
      "Which customers are inactive?",
      "Show dormant customers",
      "Who has not purchased recently?",
      "Tell me about lost customers",
      "Which buyers have gone quiet?",
      "How many customers have not returned?",
      "Give me inactive customer list",
      "Who should I try to win back?",
    ],
    response:
      "You currently have 27 customers who have not purchased in the last 30 days. Most of them previously bought accessories, so a targeted follow-up offer would likely bring some of them back quickly.",
    followUp:
      "If you want, I can suggest a recovery campaign for those inactive buyers.",
  },
  {
    id: "new_customers",
    label: "customers",
    patterns: ["new customers", "customer acquisition", "new buyers", "first time customers"],
    examples: [
      "How many new customers did I get?",
      "Show customer acquisition",
      "Tell me about first-time buyers",
      "Are new customers growing?",
      "How many new buyers came this month?",
      "Give me new customer numbers",
      "Where is new customer growth coming from?",
      "What products attract new customers?",
    ],
    response:
      "You added 23 new customers this month, which is 31% more than last month. Entry-priced accessories and earbuds are your strongest first-purchase products.",
    followUp:
      "I can also show which channels or products are bringing in those new customers.",
  },
  {
    id: "average_order_value",
    label: "sales",
    patterns: ["average order value", "aov", "avg order", "order value"],
    examples: [
      "What is my average order value?",
      "Show AOV",
      "Tell me average basket size",
      "How much does a typical order bring in?",
      "What is the average bill amount?",
      "Give me order value analysis",
      "Is average order value improving?",
      "How big is the average customer purchase?",
    ],
    response:
      "Your current average order value is Rs 6,621. It is down 3% month over month, but order count is up, so overall sales are still trending positively.",
    followUp:
      "I can help you raise AOV by showing the best bundle or upsell opportunities.",
  },
  {
    id: "discount_impact",
    label: "profit",
    patterns: ["discount impact", "offers impact", "promotion impact", "discount performance"],
    examples: [
      "How are discounts affecting business?",
      "Show promotion impact",
      "Did offers improve sales?",
      "What is the effect of discounts?",
      "Are promotions working?",
      "Give me discount performance",
      "Did campaigns increase orders?",
      "How much margin did discounts cost me?",
    ],
    response:
      "Recent discount campaigns increased unit sales by 17%, especially on audio devices and accessories. The main tradeoff was a 2.4-point drop in margin on promoted items, so targeted promotions are working better than storewide discounts.",
    followUp:
      "If you want, I can tell you which promotions were worth it and which ones hurt margin too much.",
  },
  {
    id: "best_time_sales",
    label: "sales",
    patterns: ["best time", "peak hour", "busy hour", "when do i sell most"],
    examples: [
      "When is my busiest sales hour?",
      "What is the best time for sales?",
      "Show peak business hours",
      "When do customers buy the most?",
      "What time should I push offers?",
      "Tell me my peak store hours",
      "Which hours sell best?",
      "When is traffic strongest?",
    ],
    response:
      "Your peak sales window is 2 PM to 4 PM, with the highest conversion around 3 PM. Evenings between 7 PM and 8 PM are also strong for quick accessory purchases.",
    followUp:
      "I can also map that into staffing or promotion timing suggestions.",
  },
  {
    id: "slow_moving_products",
    label: "products",
    patterns: ["slow moving", "not selling", "dead stock", "slow products"],
    examples: [
      "Which products are slow moving?",
      "Show me dead stock",
      "What items are not selling?",
      "Which products should I clear out?",
      "Tell me my slowest SKUs",
      "What stock is sitting too long?",
      "Which items need a discount?",
      "Show low movement products",
    ],
    response:
      "Your slowest-moving items are entry-level printers, older wired accessories, and one older keyboard model. These are tying up shelf space and would benefit from bundling or clearance pricing.",
    followUp:
      "I can suggest which items should be discounted, bundled, or phased out first.",
  },
  {
    id: "supplier_performance",
    label: "operations",
    patterns: ["supplier performance", "vendor performance", "best supplier", "supplier delays"],
    examples: [
      "How are my suppliers performing?",
      "Show vendor performance",
      "Which supplier is best?",
      "Are any suppliers delayed?",
      "Tell me supplier turnaround issues",
      "Which vendors are reliable?",
      "Give me supplier analysis",
      "What supplier is hurting operations?",
    ],
    response:
      "Samsung and Xiaomi suppliers are performing well on fill rate and delivery consistency. Your printer supplier has the weakest turnaround, averaging 2.5 days slower than expected.",
    followUp:
      "I can also flag which suppliers are affecting stockouts or margins the most.",
  },
  {
    id: "cash_flow",
    label: "operations",
    patterns: ["cash flow", "cash position", "working capital", "cash situation"],
    examples: [
      "How is cash flow?",
      "Show cash position",
      "What is my working capital situation?",
      "Is cash flow healthy?",
      "Tell me about store liquidity",
      "Can I afford more inventory?",
      "How tight is cash right now?",
      "Give me a cash flow summary",
    ],
    response:
      "Your cash flow looks stable for the current cycle. Fast-moving accessories are supporting liquidity, but large hardware restocks should be staggered to avoid locking too much working capital at once.",
    followUp:
      "If you want, I can help you balance restocking with cash preservation.",
  },
  {
    id: "payment_methods",
    label: "operations",
    patterns: ["payment methods", "upi", "card vs cash", "payment mix"],
    examples: [
      "What payment methods do customers use most?",
      "Show payment mix",
      "Is UPI leading payments?",
      "Compare card and cash usage",
      "How are customers paying?",
      "Tell me payment method breakdown",
      "What is the checkout payment split?",
      "Give me payment behavior",
    ],
    response:
      "UPI is your top payment method at 46% of transactions, followed by card at 31%, cash at 19%, and wallet payments at 4%. UPI users also have the fastest checkout completion rate.",
    followUp:
      "I can also compare payment mix by order size or customer segment.",
  },
  {
    id: "returns_refunds",
    label: "operations",
    patterns: ["returns", "refunds", "return rate", "refund rate"],
    examples: [
      "What is my return rate?",
      "Show returns and refunds",
      "Are refunds increasing?",
      "Which products get returned most?",
      "Tell me return performance",
      "How bad are refunds this month?",
      "Give me returns analysis",
      "What is causing product returns?",
    ],
    response:
      "Your return rate is 2.8% this month, with most returns concentrated in low-cost accessories and one headphone SKU. That is within a manageable range, but it would be worth checking supplier quality on those items.",
    followUp:
      "I can point out which SKUs are driving those returns if you want to act on it.",
  },
  {
    id: "forecast_next_week",
    label: "forecast",
    patterns: ["forecast next week", "next week sales", "sales forecast", "upcoming demand"],
    examples: [
      "What is my sales forecast for next week?",
      "Show next week's demand",
      "How much might I sell next week?",
      "Forecast next week's business",
      "What is the upcoming sales outlook?",
      "Tell me next week's projected revenue",
      "What should I expect next week?",
      "Give me next week demand forecast",
    ],
    response:
      "Based on recent trends, next week's projected sales are around Rs 13,10,000 to Rs 13,60,000. Accessories, earbuds, and power banks should continue leading unit volume, while TVs and phones will drive high-value transactions.",
    followUp:
      "I can turn that forecast into staffing, stock, or promotion recommendations.",
  },
  {
    id: "best_action",
    label: "forecast",
    patterns: ["what should i do", "next action", "what do you recommend", "business recommendation"],
    examples: [
      "What should I do next?",
      "What do you recommend for my store?",
      "Give me the next best action",
      "How should I improve business right now?",
      "What is the smartest next move?",
      "Tell me my top priority",
      "What should I focus on this week?",
      "Give me a business recommendation",
    ],
    response:
      "My top recommendation is to restock your fast-moving premium items, run a targeted offer for inactive customers, and push high-margin accessories alongside phone sales. That combination should improve both revenue and margin without adding much operational complexity.",
    followUp:
      "If you want, I can turn that into a simple action plan for this week.",
  },
];

export const CHAT_INTENT_QUESTION_COUNT = CHAT_INTENTS.reduce(
  (total, intent) => total + intent.examples.length,
  0,
);
