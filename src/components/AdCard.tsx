import { Card } from "./ui/card";

const AdCard = () => {
  return (
    <Card className="p-4 bg-white shadow-sm w-[728px] h-[90px]">
      <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
        <div className="text-center space-y-2">
          <p className="text-gray-400 text-sm">Advertisement Space</p>
          <p className="text-gray-300 text-xs">300 x 600</p>
        </div>
      </div>
    </Card>
  );
};

export default AdCard;
