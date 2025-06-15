
import { useState, useRef } from "react";
import { Equipment, EquipmentCategory, createEquipment, updateEquipment, uploadEquipmentImage } from "@/services/equipmentService";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";

export const useEquipmentForm = (onSuccess: () => void) => {
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    category: 'Leitora' as EquipmentCategory,
    average_price: '',
    min_stock: '',
    initial_stock: '',
    supplier_id: '',
    image_url: '',
    quality_status: 'Em Teste'
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [categories, setCategories] = useState<string[]>(['Leitora', 'Sensor', 'Rastreador', 'Acessório']);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    // Handle numeric fields - allow empty values and valid numbers
    if (id === 'average_price' || id === 'min_stock' || id === 'initial_stock') {
      // Allow empty string or valid numbers (including decimal for average_price)
      if (value === '' || (id === 'average_price' ? /^\d*\.?\d*$/.test(value) : /^\d*$/.test(value))) {
        setFormData(prev => ({
          ...prev,
          [id]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [id]: value
      }));
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    if (field === 'category' && value === 'new') {
      setIsAddCategoryModalOpen(true);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddCategory = (newCategory: string) => {
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    setFormData(prev => ({
      ...prev,
      category: newCategory as EquipmentCategory
    }));
    toast.success('Categoria adicionada com sucesso!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const resetForm = () => {
    setFormData({
      brand: '',
      model: '',
      category: 'Leitora',
      average_price: '',
      min_stock: '',
      initial_stock: '',
      supplier_id: '',
      image_url: '',
      quality_status: 'Em Teste'
    });
    setImageFile(null);
    setImagePreview(null);
    setIsAddCategoryModalOpen(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const setFormDataFromEquipment = (equipment: Equipment) => {
    setFormData({
      brand: equipment.brand,
      model: equipment.model,
      category: equipment.category,
      average_price: equipment.average_price?.toString() || '',
      min_stock: equipment.min_stock?.toString() || '',
      initial_stock: equipment.initial_stock?.toString() || '',
      supplier_id: equipment.supplier_id || '',
      image_url: equipment.image_url || '',
      quality_status: equipment.quality_status || 'Em Teste'
    });
    
    if (equipment.image_url) {
      setImagePreview(equipment.image_url);
    } else {
      setImagePreview(null);
    }
  };

  const handleSaveEquipment = async () => {
    try {
      setIsUploading(true);
      
      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadEquipmentImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      const dataToSave = {
        ...formData,
        average_price: formData.average_price ? parseFloat(formData.average_price) : 0,
        min_stock: formData.min_stock ? parseInt(formData.min_stock) : 0,
        initial_stock: formData.initial_stock ? parseInt(formData.initial_stock) : 0,
        image_url: imageUrl,
        created_by: profile?.id
      };
      
      console.log("Saving equipment data:", dataToSave);
      await createEquipment(dataToSave);
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Error creating equipment:", error);
      toast.error("Erro ao criar equipamento");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateEquipment = async (equipmentId: string) => {
    try {
      setIsUploading(true);
      
      let imageUrl = formData.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadEquipmentImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      const dataToUpdate = {
        ...formData,
        average_price: formData.average_price ? parseFloat(formData.average_price) : 0,
        min_stock: formData.min_stock ? parseInt(formData.min_stock) : 0,
        initial_stock: formData.initial_stock ? parseInt(formData.initial_stock) : 0,
        image_url: imageUrl
      };
      
      await updateEquipment(equipmentId, dataToUpdate);
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Error updating equipment:", error);
      toast.error("Erro ao atualizar equipamento");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setFormData(prev => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return {
    formData,
    imageFile,
    imagePreview,
    isUploading,
    categories,
    isAddCategoryModalOpen,
    fileInputRef,
    handleInputChange,
    handleSelectChange,
    handleAddCategory,
    handleFileChange,
    resetForm,
    setFormDataFromEquipment,
    handleSaveEquipment,
    handleUpdateEquipment,
    removeImage,
    setIsAddCategoryModalOpen
  };
};
