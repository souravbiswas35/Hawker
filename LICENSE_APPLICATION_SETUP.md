# Enhanced Vendor License Application System

This document provides setup instructions for the new 6-step vendor license application system.

## Overview

The enhanced system includes:
- **Step 1**: License Type selection (Daily/Weekly/Monthly/Annual)
- **Step 2**: Zone Selection with interactive map
- **Step 3**: Business Details form
- **Step 4**: Document Verification
- **Step 5**: Fee Payment system
- **Step 6**: Review & Submit with tracking

## Database Setup

### Prerequisites
- MySQL server installed and running
- Node.js and npm installed

### Step 1: Run Database Schema Updates

The new system requires additional database tables and columns. Run the SQL scripts in order:

#### Option A: Using PowerShell Script (Recommended)
```powershell
cd Backend
.\setup_database.ps1
```

#### Option B: Manual MySQL Commands
```bash
cd Backend
mysql -u root -p < sql/03_license_application_schema.sql
mysql -u root -p < sql/04_demo_data_license_app.sql
```

### Step 2: Verify Database Setup

Connect to MySQL and verify the new tables:
```sql
USE hawker;
SHOW TABLES;
DESCRIBE license_types;
DESCRIBE vending_zones;
DESCRIBE application_payments;
DESCRIBE application_step_progress;
```

## Backend Setup

### Install Dependencies
```bash
cd Backend
npm install
```

### Environment Variables
Ensure your `.env` file contains the required database connection settings.

### Start Backend Server
```bash
npm start
```

The backend will now include new API endpoints:
- `GET /api/license/license-types` - Get available license types
- `GET /api/license/vending-zones` - Get vending zones
- `POST /api/license/applications` - Create new application
- `PUT /api/license/applications/:id/steps/:step` - Update application step
- `GET /api/license/applications/:id` - Get application details
- `GET /api/license/applications` - Get user applications

## Frontend Setup

### Install Dependencies
```bash
cd Frontend
npm install
```

### Start Frontend Development Server
```bash
npm run dev
```

## New Components

### License Application Flow
The main application is now handled by:
- `Frontend/src/components/license/LicenseApplication.jsx` - Main orchestrator
- `Frontend/src/components/license/steps/Step1LicenseType.jsx` - License type selection
- `Frontend/src/components/license/steps/Step2ZoneSelection.jsx` - Zone selection with map
- `Frontend/src/components/license/steps/Step3BusinessDetails.jsx` - Business details form
- `Frontend/src/components/license/steps/Step4DocumentVerification.jsx` - Document upload/verification
- `Frontend/src/components/license/steps/Step5FeePayment.jsx` - Fee payment processing
- `Frontend/src/components/license/steps/Step6ReviewSubmit.jsx` - Final review and submission

### Backend Controllers
- `Backend/src/controllers/licenseApplicationController.js` - Handles all license application logic

### Backend Routes
- `Backend/src/routes/licenseApplicationRoutes.js` - API routes for license applications

## Features

### Step 1 - License Type
- Dynamic pricing based on license duration
- Visual comparison table
- Annual license savings indicator

### Step 2 - Zone Selection
- Interactive map placeholder (ready for map integration)
- Zone filtering by area and type
- Real-time availability display
- Primary and alternate zone selection

### Step 3 - Business Details
- Category selection with examples
- Operating hours and days
- Stall size options
- Staff count and special requirements

### Step 4 - Document Verification
- Integration with existing document system
- Required vs optional documents
- Upload progress indicators
- Health certificate requirement for food vendors

### Step 5 - Fee Payment
- Multiple payment methods (bKash, Nagad, Visa, Mastercard)
- 5% cashback on bKash payments
- Pay later option
- Transaction ID tracking

### Step 6 - Review & Submit
- Complete application summary
- Edit capability for each section
- Digital signature
- Declaration acceptance
- Tracking number generation

## Database Schema Changes

### New Tables
1. **license_types** - License types with pricing
2. **vending_zones** - Detailed zone information
3. **application_payments** - Payment records
4. **application_step_progress** - Step-by-step progress tracking

### Enhanced Tables
1. **license_applications** - Added columns for multi-step support
   - `license_type_id`
   - `primary_zone_id`
   - `alternate_zone_id`
   - `business_details` (JSON)
   - `document_verification` (JSON)
   - `payment_details` (JSON)
   - `final_submission` (JSON)
   - `current_step`
   - `completed_steps` (JSON)
   - `tracking_number`

## Testing

### Manual Testing Steps
1. Navigate to `/vendor/apply`
2. Complete each step sequentially
3. Verify data persistence between steps
4. Test payment flow (mock for development)
5. Verify final submission and tracking number generation

### API Testing
Use Postman or similar tool to test the new endpoints:
- Test license types retrieval
- Test zone filtering
- Test application creation and step updates
- Verify payment processing

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure MySQL is running and credentials are correct
2. **Missing Tables**: Run the SQL schema scripts in correct order
3. **API Errors**: Check backend logs for detailed error messages
4. **Frontend Build**: Clear node_modules and reinstall if needed

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=*
npm start
```

## Production Deployment

### Database Migration
Run the SQL scripts on production database:
```bash
mysql -u [user] -p [database] < sql/03_license_application_schema.sql
mysql -u [user] -p [database] < sql/04_demo_data_license_app.sql
```

### Environment Variables
Set production environment variables:
- Database connection
- JWT secret
- File upload paths
- Payment gateway credentials

## Future Enhancements

### Map Integration
- Replace placeholder with actual map (Google Maps, OpenStreetMap)
- Real-time zone availability updates
- Geolocation features

### Payment Gateway
- Integrate with actual payment providers
- Webhook handling for payment confirmations
- Refund processing

### Notifications
- Email notifications for application updates
- SMS alerts for status changes
- Push notifications for mobile app

### Admin Dashboard
- Enhanced application management
- Zone occupancy analytics
- Revenue reporting

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the database schema
3. Examine browser console for frontend errors
4. Check backend logs for API issues
