import ChildrenList from '../components/ChildrenList';

const GuardianDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Painel do Responsável
          </h1>
          
          <div className="bg-white shadow rounded-lg">
            <ChildrenList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuardianDashboard; 