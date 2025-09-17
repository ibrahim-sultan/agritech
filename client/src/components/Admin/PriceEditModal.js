import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import './PriceEditModal.css';

const PriceEditModal = ({ price, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    cropName: '',
    cropNameYoruba: '',
    market: {
      name: '',
      location: { state: '', lga: '' }
    },
    pricePerUnit: {
      value: '',
      unit: '',
      currency: 'NGN'
    },
    season: '',
    quality: '',
    availability: '',
    trend: {
      direction: 'stable',
      percentage: 0
    },
    source: 'market_survey',
    notes: {
      english: '',
      yoruba: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (price && isOpen) {
      setFormData({
        cropName: price.cropName || '',
        cropNameYoruba: price.cropNameYoruba || '',
        market: {
          name: price.market?.name || '',
          location: {
            state: price.market?.location?.state || '',
            lga: price.market?.location?.lga || ''
          }
        },
        pricePerUnit: {
          value: price.pricePerUnit?.value || '',
          unit: price.pricePerUnit?.unit || '',
          currency: price.pricePerUnit?.currency || 'NGN'
        },
        season: price.season || '',
        quality: price.quality || 'standard',
        availability: price.availability || 'moderate',
        trend: {
          direction: price.trend?.direction || 'stable',
          percentage: price.trend?.percentage || 0
        },
        source: price.source || 'market_survey',
        notes: {
          english: price.notes?.english || '',
          yoruba: price.notes?.yoruba || ''
        }
      });
    }
  }, [price, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) current[keys[i]] = {};
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (price) {
        // Edit mode
        await onSave(price._id, formData);
      } else {
        // Add mode
        await onSave(formData);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save price');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content price-edit-modal">
        <div className="modal-header">
          <h2>{price ? 'Edit Crop Price' : 'Add New Crop Price'}</h2>
          <button className="close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="price-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cropName">Crop Name</label>
              <select
                id="cropName"
                name="cropName"
                value={formData.cropName}
                onChange={handleChange}
                required
              >
                <option value="">Select Crop</option>
                <option value="yam">Yam</option>
                <option value="cassava">Cassava</option>
                <option value="maize">Maize</option>
                <option value="tomatoes">Tomatoes</option>
                <option value="beans">Beans</option>
                <option value="pepper">Pepper</option>
                <option value="onions">Onions</option>
                <option value="plantain">Plantain</option>
                <option value="rice">Rice</option>
                <option value="cocoyam">Cocoyam</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="cropNameYoruba">Yoruba Name</label>
              <input
                type="text"
                id="cropNameYoruba"
                name="cropNameYoruba"
                value={formData.cropNameYoruba}
                onChange={handleChange}
                placeholder="e.g., Isu"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="market.name">Market</label>
              <select
                id="market.name"
                name="market.name"
                value={formData.market.name}
                onChange={handleChange}
                required
              >
                <option value="">Select Market</option>
                <option value="Igbaja Local Market">Igbaja Local Market</option>
                <option value="Ilorin Central Market">Ilorin Central Market</option>
                <option value="Offa Market">Offa Market</option>
                <option value="Lagos Wholesale Market">Lagos Wholesale Market</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="pricePerUnit.value">Price (₦)</label>
              <input
                type="number"
                id="pricePerUnit.value"
                name="pricePerUnit.value"
                value={formData.pricePerUnit.value}
                onChange={handleChange}
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="pricePerUnit.unit">Unit</label>
              <select
                id="pricePerUnit.unit"
                name="pricePerUnit.unit"
                value={formData.pricePerUnit.unit}
                onChange={handleChange}
                required
              >
                <option value="">Select Unit</option>
                <option value="per tuber">per tuber</option>
                <option value="per bag">per bag</option>
                <option value="per basket">per basket</option>
                <option value="per kg">per kg</option>
                <option value="per tonne">per tonne</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="season">Season</label>
              <select
                id="season"
                name="season"
                value={formData.season}
                onChange={handleChange}
                required
              >
                <option value="">Select Season</option>
                <option value="wet_season">Wet Season</option>
                <option value="dry_season">Dry Season</option>
                <option value="harvest_season">Harvest Season</option>
                <option value="planting_season">Planting Season</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="quality">Quality</label>
              <select
                id="quality"
                name="quality"
                value={formData.quality}
                onChange={handleChange}
              >
                <option value="premium">Premium</option>
                <option value="standard">Standard</option>
                <option value="low_grade">Low Grade</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="availability">Availability</label>
              <select
                id="availability"
                name="availability"
                value={formData.availability}
                onChange={handleChange}
              >
                <option value="abundant">Abundant</option>
                <option value="moderate">Moderate</option>
                <option value="scarce">Scarce</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="trend.direction">Price Trend</label>
              <select
                id="trend.direction"
                name="trend.direction"
                value={formData.trend.direction}
                onChange={handleChange}
              >
                <option value="rising">Rising</option>
                <option value="falling">Falling</option>
                <option value="stable">Stable</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="trend.percentage">Trend % (optional)</label>
              <input
                type="number"
                id="trend.percentage"
                name="trend.percentage"
                value={formData.trend.percentage}
                onChange={handleChange}
                step="0.1"
                placeholder="e.g., 8.5"
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="notes.english">Notes (English)</label>
            <textarea
              id="notes.english"
              name="notes.english"
              value={formData.notes.english}
              onChange={handleChange}
              rows="3"
              placeholder="Additional notes about this price..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="save-button">
              <FontAwesomeIcon icon={faSave} />
              {loading ? 'Saving...' : (price ? 'Save Changes' : 'Add Price')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PriceEditModal;
