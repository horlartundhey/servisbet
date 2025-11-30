const Index = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        maxWidth: '600px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#f91942',
          marginBottom: '20px'
        }}>
          ServisbetA
        </h1>
        
        <p style={{
          fontSize: '20px',
          color: '#666',
          marginBottom: '30px'
        }}>
          Find Your Perfect Business
        </p>
        
        <div style={{
          background: '#f0f9ff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#0369a1', marginBottom: '10px' }}>
            ✅ iOS Safari Compatibility Test
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            If you can see this page, the basic React app is working on iOS!
          </p>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginTop: '30px'
        }}>
          <div style={{
            background: '#fef3c7',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#d97706' }}>
              500K+
            </div>
            <div style={{ fontSize: '14px', color: '#78350f', marginTop: '5px' }}>
              Reviews
            </div>
          </div>
          
          <div style={{
            background: '#dbeafe',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb' }}>
              50K+
            </div>
            <div style={{ fontSize: '14px', color: '#1e3a8a', marginTop: '5px' }}>
              Businesses
            </div>
          </div>
          
          <div style={{
            background: '#fce7f3',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#db2777' }}>
              1M+
            </div>
            <div style={{ fontSize: '14px', color: '#831843', marginTop: '5px' }}>
              Photos
            </div>
          </div>
        </div>
        
        <p style={{
          marginTop: '30px',
          fontSize: '14px',
          color: '#999',
          fontStyle: 'italic'
        }}>
          Testing simplified React version for iOS compatibility
        </p>
      </div>
    </div>
  );
};

export default Index;
