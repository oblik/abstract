const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files to fix loose equality
const filesToFix = [
  'config/config.js',
  'lib/roundOf.js',
  'config/axios.js',
  'app/validation/validation.js',
  'app/Authentication.jsx',
  'app/profile-old/activity.tsx',
  'app/profile-old/page.tsx',
  'app/event-page/[id]/_components/EventPage.jsx',
  'app/portfolio/OpenOrders.js',
  'app/portfolio/PortfolioPage.js',
  'app/portfolio/History.js',
  'app/portfolio/Positions.js',
  'app/portfolio/withdraw.js',
  'app/profile/[slug]/activity.tsx',
  'app/profile/[slug]/Profile.tsx',
  'app/components/customComponents/Chart.tsx',
  'app/components/customComponents/ChartWidget.tsx',
  'app/components/customComponents/LimitOrder.tsx',
  'app/components/customComponents/MarketOrder.tsx',
  'app/components/customComponents/MonthlyListenersChart2.tsx',
  'app/components/customComponents/Notifications.jsx',
  'app/components/customComponents/OpenOrderDialog.tsx',
  'app/components/customComponents/OrderbookChart.tsx',
  'app/components/customComponents/TradingCard.jsx',
  'app/components/ui/comment.tsx',
  'app/components/ui/eventCard.tsx',
  'app/components/ui/multipleOptionCard.tsx',
  'app/components/ui/orderbookAccordion.tsx',
  'app/helper/custommath.js'
];

// Function to fix loose equality in a file
function fixLooseEquality(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Replace loose equality with strict equality, but be careful not to replace in comments or strings
    let fixedContent = content;
    
    fixedContent = fixedContent.replace(/([^=!])==(?!>)/g, '$1===');
    
    // Replace != with !==
    fixedContent = fixedContent.replace(/([^=!])!=(?!=)/g, '$1!==');
    
    // Write back to file
    fs.writeFileSync(filePath, fixedContent, 'utf8');

  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
  }
}

// Fix all files
filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    fixLooseEquality(fullPath);
  } else {

  }
});
