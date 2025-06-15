
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
    quality_status: 'Em Teste',
    created_by: '',
    created_at: ''
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

  const handleDeleteCategory = (categoryToDelete: string) => {
    const updatedCategories = categories.filter(cat => cat !== categoryToDelete);
    setCategories(updatedCategories);
    
    // Se a categoria atual foi excluída, volta para a primeira categoria disponível
    if (formData.category === categoryToDelete && updatedCategories.length > 0) {
      setFormData(prev => ({
        ...prev,
        category: updatedCategories[0] as EquipmentCategory
      }));
    }
    
    toast.success('Categoria excluída com sucesso!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log("File selected:", file.name, "Size:", file.size);
      
      setImageFile(file);
      
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Clear the current image_url when a new file is selected
      setFormData(prev => ({
        ...prev,
        image_url: '' // This will be updated after successful upload
      }));
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
      quality_status: 'Em Teste',
      created_by: '',
      created_at: ''
    });
    setImageFile(null);
    setImagePreview(null);
    setIsAddCategoryModalOpen(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const setFormDataFromEquipment = (equipment: Equipment) => {
    console.log("Setting form data from equipment:", equipment);
    setFormData({
      brand: equipment.brand,
      model: equipment.model,
      category: equipment.category,
      average_price: equipment.average_price?.toString() || '',
      min_stock: equipment.min_stock?.toString() || '',
      initial_stock: equipment.initial_stock?.toString() || '',
      supplier_id: equipment.supplier_id || '',
      image_url: equipment.image_url || '',
      quality_status: equipment.quality_status || 'Em Teste',
      created_by: equipment.created_by || '',
      created_at: equipment.created_at || '',
    });
    
    // Set preview to existing image URL, clear selected file
    if (equipment.image_url) {
      setImagePreview(equipment.image_url);
      console.log("Setting image preview to existing URL:", equipment.image_url);
    } else {
      setImagePreview(null);
    }
    
    // Clear any selected file when editing existing equipment
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveEquipment = async () => {
    try {
      setIsUploading(true);
      console.log("Starting equipment save process...");
      
      let finalImageUrl = formData.image_url;
      
      // Only upload if there's a new file selected
      if (imageFile) {
        console.log("Uploading new image file...");
        const uploadedUrl = await uploadEquipmentImage(imageFile);
        
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
          console.log("Image uploaded successfully:", uploadedUrl);
          
          // Update form data with the new URL
          setFormData(prev => ({
            ...prev,
            image_url: uploadedUrl
          }));
        } else {
          console.error("Image upload failed - no URL returned");
          toast.error("Erro ao fazer upload da imagem");
          return;
        }
      } else {
        console.log("No new image file to upload, using existing URL:", finalImageUrl);
      }
      
      const dataToSave = {
        ...formData,
        average_price: formData.average_price ? parseFloat(formData.average_price) : 0,
        min_stock: formData.min_stock ? parseInt(formData.min_stock) : 0,
        initial_stock: formData.initial_stock ? parseInt(formData.initial_stock) : 0,
        image_url: finalImageUrl,
        created_by: profile?.id
      };
      
      console.log("Saving equipment data:", dataToSave);
      const result = await createEquipment(dataToSave);
      
      if (result) {
        console.log("Equipment saved successfully:", result.id);
        toast.success("Equipamento criado com sucesso!");
        resetForm();
        onSuccess();
      } else {
        console.error("Equipment save failed - no result returned");
        toast.error("Erro ao criar equipamento");
      }
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
      console.log("Starting equipment update process for ID:", equipmentId);
      
      let finalImageUrl = formData.image_url;
      
      // Only upload if there's a new file selected
      if (imageFile) {
        console.log("Uploading new image file for update...");
        const uploadedUrl = await uploadEquipmentImage(imageFile);
        
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
          console.log("New image uploaded successfully:", uploadedUrl);
        } else {
          console.error("Image upload failed during update - no URL returned");
          toast.error("Erro ao fazer upload da nova imagem");
          return;
        }
      } else {
        console.log("No new image file to upload during update, keeping existing URL:", finalImageUrl);
      }
      
      const dataToUpdate = {
        ...formData,
        average_price: formData.average_price ? parseFloat(formData.average_price) : 0,
        min_stock: formData.min_stock ? parseInt(formData.min_stock) : 0,
        initial_stock: formData.initial_stock ? parseInt(formData.initial_stock) : 0,
        image_url: finalImageUrl
      };
      
      console.log("Updating equipment with data:", dataToUpdate);
      const result = await updateEquipment(equipmentId, dataToUpdate);
      
      if (result) {
        console.log("Equipment updated successfully:", result.id);
        toast.success("Equipamento atualizado com sucesso!");
        resetForm();
        onSuccess();
      } else {
        console.error("Equipment update failed - no result returned");
        toast.error("Erro ao atualizar equipamento");
      }
    } catch (error) {
      console.error("Error updating equipment:", error);
      toast.error("Erro ao atualizar equipamento");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    console.log("Removing image...");
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
    handleDeleteCategory,
    handleFileChange,
    resetForm,
    setFormDataFromEquipment,
    handleSaveEquipment,
    handleUpdateEquipment,
    removeImage,
    setIsAddCategoryModalOpen
  };
};
